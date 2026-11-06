'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDisclosure } from '@mantine/hooks';
import {
  Group,
  Stack,
  Text,
  Avatar,
  Button,
  ActionIcon,
  Menu,
  Drawer,
  TextInput,
  Textarea,
  Divider,
  Paper,
  Box,
  Tooltip,
  Badge,
} from '@mantine/core';
import {
  IconHeart,
  IconHeartFilled,
  IconMessageCircle,
  IconRepeat,
  IconDots,
  IconCopy,
  IconCheck,
  IconBrandLinkedin,
  IconBrandX,
  IconMail,
} from '@tabler/icons-react';
import { withBase } from '@/lib/asset';

function formatDisplayDate(dateStr, locale) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const formatted = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(d);
    return formatted.toUpperCase();
  } catch {
    return dateStr;
  }
}

export default function ArticleActions({
  id,
  slug,
  title = '',
  date = '',
  author = 'CODEUR SENIOR',
  avatar = '/img/me/face-1.png',
  showAuthor = true,
  locale = 'fr',
}) {
  const articleKey = id || slug;

  const [stats, setStats] = useState({
    likes: 0,
    reposts: 0,
    commentsCount: 0,
    shares: 0,
  });
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [repostFeedback, setRepostFeedback] = useState(false);
  const [commentsDrawerOpen, { open: openComments, close: closeComments }] = useDisclosure(false);

  // Formulaire nouveau commentaire
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Synchronisation globale de l'ouverture du tiroir de commentaires (un seul Drawer par page)
  const handleOpenComments = useCallback(() => {
    if (showAuthor) {
      openComments();
    } else {
      window.dispatchEvent(new CustomEvent('open-blog-comments', { detail: { id: articleKey } }));
    }
  }, [showAuthor, openComments, articleKey]);

  useEffect(() => {
    if (!showAuthor) return;

    const handleExternalOpen = e => {
      if (!e?.detail?.id || e.detail.id === articleKey) {
        openComments();
      }
    };

    window.addEventListener('open-blog-comments', handleExternalOpen);
    return () => {
      window.removeEventListener('open-blog-comments', handleExternalOpen);
    };
  }, [showAuthor, openComments, articleKey]);

  // Synchronisation globale du compteur si un commentaire est ajouté
  useEffect(() => {
    const handleCommentAdded = e => {
      if (e?.detail?.id === articleKey && typeof e.detail.count === 'number') {
        setStats(prev => ({ ...prev, commentsCount: e.detail.count }));
      }
    };

    window.addEventListener('blog-comment-added', handleCommentAdded);
    return () => {
      window.removeEventListener('blog-comment-added', handleCommentAdded);
    };
  }, [articleKey]);

  // Récupération des données en One-Shot (Firestore via API route)
  useEffect(() => {
    let isMounted = true;

    // Statut local persistant
    try {
      if (typeof window !== 'undefined') {
        const storedLike = localStorage.getItem(`blog_liked_${articleKey}`);
        if (storedLike === '1') setIsLiked(true);
        const storedRepost = localStorage.getItem(`blog_reposted_${articleKey}`);
        if (storedRepost === '1') setIsReposted(true);
      }
    } catch {
      // localStorage indisponible
    }

    // Requête One-Shot
    fetch(`/api/blog/reactions?id=${encodeURIComponent(articleKey)}&slug=${encodeURIComponent(slug)}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted || !data.ok) return;
        setStats({
          likes: Number(data.likes) || 0,
          reposts: Number(data.reposts) || 0,
          commentsCount: Number(data.commentsCount) || 0,
          shares: Number(data.shares) || 0,
        });
        if (Array.isArray(data.comments)) {
          setComments(data.comments);
        }
      })
      .catch(err => {
        console.warn('[ArticleActions] Erreur récupération réactions one-shot:', err?.message);
      });

    return () => {
      isMounted = false;
    };
  }, [articleKey, slug]);

  // Action Like / Unlike (One-shot)
  const handleLike = async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setStats(prev => ({
      ...prev,
      likes: Math.max(0, prev.likes + (nextLiked ? 1 : -1)),
    }));

    try {
      if (typeof window !== 'undefined') {
        if (nextLiked) {
          localStorage.setItem(`blog_liked_${articleKey}`, '1');
        } else {
          localStorage.removeItem(`blog_liked_${articleKey}`);
        }
      }
    } catch {
      // Ignorer
    }

    try {
      await fetch('/api/blog/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: articleKey,
          slug,
          action: nextLiked ? 'like' : 'unlike',
        }),
      });
    } catch (err) {
      console.warn('[ArticleActions] Erreur enregistrement like:', err?.message);
    }
  };

  // Action Repost (Option 3 : Copie de citation prête à coller + One-shot Firebase)
  const handleRepost = async () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const quote = `« ${title} » par ${author}\n🔗 ${currentUrl}`;

    if (typeof window !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(quote);
      } catch {
        // Ignorer si presse-papier inaccessible
      }
    }

    setRepostFeedback(true);
    setTimeout(() => setRepostFeedback(false), 2800);

    if (!isReposted) {
      setIsReposted(true);
      setStats(prev => ({ ...prev, reposts: prev.reposts + 1 }));

      try {
        localStorage.setItem(`blog_reposted_${articleKey}`, '1');
      } catch {
        // Ignorer
      }

      try {
        await fetch('/api/blog/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: articleKey, slug, action: 'repost' }),
        });
      } catch (err) {
        console.warn('[ArticleActions] Erreur repost:', err?.message);
      }
    }
  };

  // Action Partager (Web Share API ou Copier le lien)
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: title || 'Article Blog',
      text: title,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        await fetch('/api/blog/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: articleKey, slug, action: 'share' }),
        });
        setStats(prev => ({ ...prev, shares: prev.shares + 1 }));
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback : copie dans le presse-papier
    copyLinkToClipboard();
  };

  const copyLinkToClipboard = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // Soumission commentaire (One-shot)
  const handleSubmitComment = async e => {
    e?.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch('/api/blog/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: articleKey,
          slug,
          action: 'comment',
          author: commentAuthor.trim() || (locale === 'en' ? 'Visitor' : 'Visiteur'),
          text: commentText.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok && data.comment) {
        setComments(prev => [data.comment, ...prev]);
        setStats(prev => {
          const nextCount = prev.commentsCount + 1;
          try {
            window.dispatchEvent(new CustomEvent('blog-comment-added', { detail: { count: nextCount, id: articleKey } }));
          } catch {
            // Ignorer
          }
          return { ...prev, commentsCount: nextCount };
        });
        setCommentText('');
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 3000);
      }
    } catch (err) {
      console.warn('[ArticleActions] Erreur envoi commentaire:', err?.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = encodeURIComponent(title || 'Article de blog');
  const encodedUrl = encodeURIComponent(currentUrl);

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const mailUrl = `mailto:?subject=${shareText}&body=${encodedUrl}`;

  return (
    <Box py="sm" data-testid="article-actions-container">
      {/* 1. Ligne Auteur (Avatar + Nom + Date) */}
      {showAuthor && (
        <Group gap="sm" mb="md" align="center" data-testid="article-author-row">
          <Avatar src={withBase(avatar)} alt={author} radius="xl" size={44} style={{ border: '1px solid var(--mantine-color-default-border)' }} />
          <Stack gap={1} justify="center">
            <Text
              size="sm"
              fw={700}
              style={{
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                lineHeight: 1.2,
              }}>
              {author}
            </Text>
            <Text size="xs" c="dimmed" fw={500} style={{ letterSpacing: '0.02em' }}>
              {formatDisplayDate(date, locale)}
            </Text>
          </Stack>
        </Group>
      )}

      {/* 2. Barre d'action (Boutons Likes, Commentaires, Repost, Partager, Options) */}
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        {/* Groupe gauche */}
        <Group gap="xs" align="center">
          {/* Bouton Like / Coeur */}
          <Tooltip label={isLiked ? 'Je n’aime plus' : 'J’aime'} withArrow position="top">
            <Button
              variant="default"
              radius="xl"
              size="sm"
              onClick={handleLike}
              data-testid="article-like-button"
              styles={{
                root: {
                  height: 38,
                  paddingLeft: 14,
                  paddingRight: 14,
                  borderColor: isLiked ? 'var(--mantine-color-kamit-filled)' : undefined,
                  color: isLiked ? 'var(--mantine-color-kamit-filled)' : undefined,
                  transition: 'all 0.2s ease',
                },
              }}
              leftSection={isLiked ? <IconHeartFilled size={18} color="var(--mantine-color-kamit-filled)" /> : <IconHeart size={18} />}>
              <Text size="sm" fw={600} span>
                {stats.likes}
              </Text>
            </Button>
          </Tooltip>

          {/* Bouton Commentaires */}
          <Tooltip label="Commentaires" withArrow position="top">
            <ActionIcon
              variant="default"
              radius="xl"
              size={38}
              onClick={e => {
                e.stopPropagation();
                e.currentTarget.blur();
                handleOpenComments();
              }}
              data-testid="article-comment-button"
              aria-label="Commentaires de l'article"
              style={{ transition: 'all 0.2s ease' }}>
              <IconMessageCircle size={18} />
            </ActionIcon>
          </Tooltip>

          {/* Bouton Repost (Option 3 : Citation prête à coller) */}
          <Tooltip
            label={repostFeedback ? 'Citation copiée ! Prête à coller' : 'Repartager (copier la citation)'}
            opened={repostFeedback || undefined}
            withArrow
            position="top">
            <ActionIcon
              variant="default"
              radius="xl"
              size={38}
              onClick={handleRepost}
              data-testid="article-repost-button"
              aria-label="Copier la citation pour repartager l'article"
              style={{
                color: isReposted ? 'var(--mantine-color-kamit-filled)' : undefined,
                borderColor: isReposted ? 'var(--mantine-color-kamit-filled)' : undefined,
                transition: 'all 0.2s ease',
              }}>
              <IconRepeat size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Groupe droite */}
        <Group gap="xs" align="center">
          {/* Bouton Partager */}
          <Tooltip label={copied ? 'Lien copié !' : 'Partager cet article'} withArrow position="top">
            <Button
              variant="default"
              radius="xl"
              size="sm"
              onClick={handleShare}
              data-testid="article-share-button"
              styles={{
                root: {
                  height: 38,
                  paddingLeft: 16,
                  paddingRight: 16,
                  transition: 'all 0.2s ease',
                },
              }}>
              <Text size="sm" fw={500} span>
                {copied ? 'Copié !' : 'Partager'}
              </Text>
            </Button>
          </Tooltip>

          {/* Bouton Plus / Menu "..." */}
          <Menu shadow="md" width={220} position="bottom-end" radius="md">
            <Menu.Target>
              <ActionIcon
                variant="default"
                radius="xl"
                size={38}
                data-testid="article-more-button"
                aria-label="Plus d'actions de partage"
                style={{ transition: 'all 0.2s ease' }}>
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Partager l’article</Menu.Label>
              <Menu.Item leftSection={copied ? <IconCheck size={16} color="green" /> : <IconCopy size={16} />} onClick={copyLinkToClipboard}>
                {copied ? 'Lien copié !' : 'Copier le lien'}
              </Menu.Item>
              <Menu.Item leftSection={<IconBrandLinkedin size={16} />} component="a" href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </Menu.Item>
              <Menu.Item leftSection={<IconBrandX size={16} />} component="a" href={twitterUrl} target="_blank" rel="noopener noreferrer">
                X (Twitter)
              </Menu.Item>
              <Menu.Item leftSection={<IconMail size={16} />} component="a" href={mailUrl}>
                Par e-mail
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Drawer des Commentaires (instance unique contrôlée) */}
      {showAuthor && (
        <Drawer
          opened={commentsDrawerOpen}
          onClose={closeComments}
          returnFocus={false}
          trapFocus={false}
          closeOnClickOutside={true}
          closeOnEscape={true}
          transitionProps={{ duration: 150 }}
          overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
          zIndex={1000}
          title={
            <Group gap="xs">
              <Text fw={700} size="md">
                Commentaires
              </Text>
              <Badge variant="light" size="sm">
                {stats.commentsCount}
              </Badge>
            </Group>
          }
          position="right"
          size="md"
          padding="md">
          <Stack gap="md">
            {/* Formulaire ajout de commentaire */}
            <Paper p="sm" withBorder radius="md" bg="var(--mantine-color-default)">
              <form onSubmit={handleSubmitComment}>
                <Stack gap="xs">
                  <TextInput
                    placeholder="Votre nom ou pseudo (optionnel)"
                    value={commentAuthor}
                    onChange={e => setCommentAuthor(e.currentTarget.value)}
                    size="sm"
                    maxLength={60}
                  />
                  <Textarea
                    placeholder="Écrivez une réponse constructive..."
                    value={commentText}
                    onChange={e => setCommentText(e.currentTarget.value)}
                    minRows={3}
                    size="sm"
                    required
                    maxLength={1000}
                  />
                  <Group justify="space-between" align="center" mt="xs">
                    {commentSuccess && (
                      <Text size="xs" c="green" fw={500}>
                        ✓ Commentaire publié !
                      </Text>
                    )}
                    <Button
                      type="submit"
                      size="xs"
                      radius="xl"
                      loading={submittingComment}
                      disabled={!commentText.trim()}
                      style={{ marginLeft: 'auto' }}>
                      Publier
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Paper>

            <Divider label="Discussions" labelPosition="center" />

            {/* Liste des commentaires */}
            {comments.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                Aucun commentaire pour le moment. Soyez le premier à réagir !
              </Text>
            ) : (
              <Stack gap="sm">
                {comments.map(c => (
                  <Paper key={c.id || Math.random()} p="sm" withBorder radius="md">
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" fw={700}>
                        {c.author || 'Visiteur'}
                      </Text>
                      {c.createdAt && (
                        <Text size="xs" c="dimmed">
                          {formatDisplayDate(c.createdAt, locale)}
                        </Text>
                      )}
                    </Group>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {c.text}
                    </Text>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </Drawer>
      )}
    </Box>
  );
}
