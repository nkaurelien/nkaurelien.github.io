import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const clip = (value, max) =>
  String(value ?? '')
    .trim()
    .slice(0, max);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const targetId = clip(searchParams.get('id') || searchParams.get('slug'), 150);

    if (!targetId) {
      return json({ error: 'Identifiant (id ou slug) manquant' }, 400);
    }

    if (!adminDb) {
      return json({
        ok: true,
        id: targetId,
        likes: 0,
        reposts: 0,
        commentsCount: 0,
        shares: 0,
        comments: [],
      });
    }

    const docRef = adminDb.collection('blog_reactions').doc(targetId);
    const docSnap = await docRef.get();

    const data = docSnap.exists ? docSnap.data() : {};

    // Lecture des commentaires en one-shot (ordonnés du plus récent au plus ancien)
    let comments = [];
    try {
      const commentsSnap = await docRef
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      comments = commentsSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
    } catch (commentErr) {
      console.warn('[blog-reactions] Erreur lecture commentaires:', commentErr?.message);
    }

    return json({
      ok: true,
      likes: Math.max(0, Number(data.likes) || 0),
      reposts: Math.max(0, Number(data.reposts) || 0),
      commentsCount: Math.max(0, Number(data.commentsCount) || comments.length),
      shares: Math.max(0, Number(data.shares) || 0),
      comments,
    });
  } catch (err) {
    console.error('[blog-reactions] GET error:', err);
    return json({ error: 'Erreur serveur.' }, 500);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const targetId = clip(body?.id || body?.slug, 150);
    const slug = clip(body?.slug, 150) || targetId;
    const action = clip(body?.action, 30);

    if (!targetId) {
      return json({ error: 'Identifiant (id ou slug) manquant' }, 400);
    }

    if (!['like', 'unlike', 'repost', 'share', 'comment'].includes(action)) {
      return json({ error: 'Action non supportée' }, 400);
    }

    if (!adminDb) {
      // Mode hors-ligne ou compte de service non configuré
      return json({ ok: true, fallback: true });
    }

    const docRef = adminDb.collection('blog_reactions').doc(targetId);

    if (action === 'like') {
      await docRef.set(
        {
          id: targetId,
          slug,
          likes: FieldValue.increment(1),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else if (action === 'unlike') {
      await adminDb.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const currentLikes = doc.exists ? (Number(doc.data().likes) || 0) : 0;
        transaction.set(
          docRef,
          {
            id: targetId,
            slug,
            likes: Math.max(0, currentLikes - 1),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      });
    } else if (action === 'repost') {
      await docRef.set(
        {
          id: targetId,
          slug,
          reposts: FieldValue.increment(1),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else if (action === 'share') {
      await docRef.set(
        {
          id: targetId,
          slug,
          shares: FieldValue.increment(1),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else if (action === 'comment') {
      const author = clip(body?.author, 60) || 'Visiteur';
      const text = clip(body?.text, 1000);

      if (!text) {
        return json({ error: 'Le commentaire ne peut pas être vide' }, 400);
      }

      const commentData = {
        author,
        text,
        createdAt: new Date().toISOString(),
      };

      const commentDocRef = await docRef.collection('comments').add(commentData);

      await docRef.set(
        {
          id: targetId,
          slug,
          commentsCount: FieldValue.increment(1),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return json({
        ok: true,
        comment: {
          id: commentDocRef.id,
          ...commentData,
        },
      });
    }

    return json({ ok: true });
  } catch (err) {
    console.error('[blog-reactions] POST error:', err);
    return json({ error: 'Erreur serveur.' }, 500);
  }
}
