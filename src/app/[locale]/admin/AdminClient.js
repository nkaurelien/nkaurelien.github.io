'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Container,
  Grid,
  Card,
  Text,
  Button,
  TextInput,
  PasswordInput,
  Title,
  Progress,
  Group,
  Alert,
  Avatar,
  Table,
  ActionIcon,
  Badge,
  Stack,
  Loader,
  Paper,
  Divider,
  Tabs,
  Textarea,
  RingProgress,
  ThemeIcon,
} from '@mantine/core';
import {
  IconBrandGoogle,
  IconUpload,
  IconTrash,
  IconCopy,
  IconCheck,
  IconLock,
  IconMail,
  IconLogout,
  IconFileFilled,
  IconAlertCircle,
  IconDashboard,
  IconFolderPlus,
  IconSettings,
  IconFiles,
  IconHome,
  IconRefresh,
} from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import { uploadFile, deleteFile } from '@/lib/storage';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';

const t = {
  fr: {
    title: 'Espace Administration',
    restrictedTitle: 'Accès Restreint',
    restrictedMsg: "Vous n'avez pas les droits nécessaires pour accéder à cet espace d'administration.",
    signedAs: 'Connecté en tant que :',
    switchAccount: 'Changer de compte',
    goHome: "Retour à l'accueil",
    adminLoginTitle: 'Connexion Administrateur',
    adminLoginSubtitle: 'Veuillez vous authentifier pour accéder au tableau de bord',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    signIn: 'Se connecter',
    googleSignIn: 'Continuer avec Google',
    dashboard: 'Tableau de Bord Admin',
    overview: 'Vue d’ensemble',
    files: 'Fichiers & CVs',
    projects: 'Projets Portfolio',
    settings: 'Configuration',
    signOut: 'Déconnexion',
    statProjects: 'Projets Actifs',
    statUploads: 'Fichiers Stockés',
    statBandwidth: 'Bande passante',
    statDatabase: 'Base de données',
    active: 'Actif',
    addProject: 'Ajouter un Projet',
    projectTitle: 'Titre du Projet',
    projectCategory: 'Catégorie',
    projectDescription: 'Description du projet',
    projectTech: 'Technologies (séparées par des virgules)',
    projectUrl: 'Lien de démo / GitHub',
    uploadThumbnail: 'Uploader la miniature (Firebase Storage)',
    saveProject: 'Enregistrer le Projet',
    projectSavedSuccess: 'Projet enregistré avec succès (Démonstration) !',
    copied: 'Copié !',
    loading: 'Vérification des droits...',
  },
  en: {
    title: 'Admin Workspace',
    restrictedTitle: 'Access Restricted',
    restrictedMsg: 'You do not have the required permissions to access this administrative space.',
    signedAs: 'Signed in as:',
    switchAccount: 'Switch Account',
    goHome: 'Back to Home',
    adminLoginTitle: 'Administrator Login',
    adminLoginSubtitle: 'Please authenticate to access the admin dashboard',
    email: 'Email address',
    password: 'Password',
    signIn: 'Sign In',
    googleSignIn: 'Continue with Google',
    dashboard: 'Admin Dashboard',
    overview: 'Overview',
    files: 'Files & Resume',
    projects: 'Portfolio Projects',
    settings: 'Settings',
    signOut: 'Sign Out',
    statProjects: 'Active Projects',
    statUploads: 'Stored Files',
    statBandwidth: 'Bandwidth',
    statDatabase: 'Database',
    active: 'Active',
    addProject: 'Add Project',
    projectTitle: 'Project Title',
    projectCategory: 'Category',
    projectDescription: 'Project Description',
    projectTech: 'Technologies (comma separated)',
    projectUrl: 'Demo / GitHub Link',
    uploadThumbnail: 'Upload Thumbnail (Firebase Storage)',
    saveProject: 'Save Project',
    projectSavedSuccess: 'Project saved successfully (Demonstration)!',
    copied: 'Copied!',
    loading: 'Checking permissions...',
  },
};

export default function AdminClient({ locale, localProjects = [] }) {
  const translations = t[locale] || t.en;
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'nkumbeaurelien@hotmail.com';

  const { user, loading: authLoading, signInWithEmail, signInWithGoogle, signOutUser } = useAuth();

  // Navigation states
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState(null);

  // Project manager states
  const [projTitle, setProjTitle] = useState('');
  const [projCategory, setProjCategory] = useState('Fullstack');
  const [projDesc, setProjDesc] = useState('');
  const [projTech, setProjTech] = useState('');
  const [projUrl, setProjUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailPath, setThumbnailPath] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [projectSuccess, setProjectSuccess] = useState(false);

  // Storage manager states
  const [docFile, setDocFile] = useState(null);
  const [docUploading, setDocUploading] = useState(false);
  const [docProgress, setDocProgress] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Firestore database states
  const [dbProjects, setDbProjects] = useState([]);
  const [dbMessages, setDbMessages] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);

  // Load documents list from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('admin_portfolio_docs');
    if (saved) {
      try {
        setUploadedDocs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved docs', e);
      }
    }
  }, []);

  const saveDocsToLocalStorage = docs => {
    localStorage.setItem('admin_portfolio_docs', JSON.stringify(docs));
  };

  const fetchAdminData = async (silent = false) => {
    if (!silent) setDbLoading(true);
    try {
      // Fetch projects
      const projSnap = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
      const projList = projSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDbProjects(projList);

      // Fetch contact messages
      const msgSnap = await getDocs(query(collection(db, 'messages'), orderBy('createdAt', 'desc')));
      const msgList = msgSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDbMessages(msgList);
    } catch (err) {
      console.error('Error loading admin database data:', err);
    } finally {
      if (!silent) setDbLoading(false);
    }
  };

  // Fetch projects and messages from Firestore on mount if admin is logged in
  useEffect(() => {
    if (user && user.email === adminEmail) {
      fetchAdminData();
    }
  }, [user, adminEmail]);

  const handleLogin = async e => {
    e.preventDefault();
    setAuthError(null);
    try {
      await signInWithEmail(loginEmail, loginPassword);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Upload Project Thumbnail
  const handleThumbnailUpload = async e => {
    const fileSelected = e.target.files[0];
    if (!fileSelected) return;

    setThumbnailFile(fileSelected);
    setUploading(true);
    setUploadProgress(0);

    const path = `portfolio/projects/thumbnails/${Date.now()}_${fileSelected.name}`;
    try {
      const downloadUrl = await uploadFile(fileSelected, path, progress => {
        setUploadProgress(progress);
      });
      setThumbnailUrl(downloadUrl);
      setThumbnailPath(path);
    } catch (error) {
      setAuthError(`Thumbnail upload error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Submit Admin Project Form
  const handleCreateProject = async e => {
    e.preventDefault();
    if (!projTitle) return;
    setUploading(true);
    setAuthError(null);
    try {
      const newProj = {
        title: projTitle,
        category: projCategory,
        description: projDesc,
        tech: projTech,
        url: projUrl,
        thumbnailUrl: thumbnailUrl || '',
        thumbnailPath: thumbnailPath || '',
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'projects'), newProj);
      setDbProjects([{ id: docRef.id, ...newProj }, ...dbProjects]);

      setProjectSuccess(true);
      setTimeout(() => setProjectSuccess(false), 3000);

      // Reset Form
      setProjTitle('');
      setProjDesc('');
      setProjTech('');
      setProjUrl('');
      setThumbnailFile(null);
      setThumbnailUrl('');
      setThumbnailPath('');
    } catch (err) {
      setAuthError(`Firestore error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Upload General Document (CV, PDF)
  const handleDocUpload = async () => {
    if (!docFile) return;
    setDocUploading(true);
    setDocProgress(0);

    const path = `portfolio/admin/documents/${Date.now()}_${docFile.name}`;
    try {
      const downloadUrl = await uploadFile(docFile, path, progress => {
        setDocProgress(progress);
      });

      const newDoc = {
        name: docFile.name,
        url: downloadUrl,
        path: path,
        uploadedAt: new Date().toLocaleDateString(),
        size: (docFile.size / 1024).toFixed(1) + ' KB',
      };

      const updated = [newDoc, ...uploadedDocs];
      setUploadedDocs(updated);
      saveDocsToLocalStorage(updated);
      setDocFile(null);
      const docInput = document.getElementById('admin-doc-input');
      if (docInput) docInput.value = '';
    } catch (error) {
      setAuthError(`Document upload error: ${error.message}`);
    } finally {
      setDocUploading(false);
    }
  };

  // Delete Document
  const handleDocDelete = async (path, index) => {
    try {
      await deleteFile(path);
      const updated = uploadedDocs.filter((_, i) => i !== index);
      setUploadedDocs(updated);
      saveDocsToLocalStorage(updated);
    } catch (error) {
      setAuthError(`Deletion error: ${error.message}`);
    }
  };

  // Delete Project from Firestore and Storage
  const handleDeleteProject = async (projId, thumbPath) => {
    setAuthError(null);
    try {
      await deleteDoc(doc(db, 'projects', projId));
      if (thumbPath) {
        try {
          await deleteFile(thumbPath);
        } catch (err) {
          console.error('Error deleting project thumbnail:', err);
        }
      }
      setDbProjects(dbProjects.filter(p => p.id !== projId));
    } catch (error) {
      setAuthError(`Project delete error: ${error.message}`);
    }
  };

  // Toggle read status of a message
  const handleMarkMessageRead = async (msgId, currentReadStatus) => {
    setAuthError(null);
    try {
      await updateDoc(doc(db, 'messages', msgId), {
        read: !currentReadStatus,
      });
      setDbMessages(dbMessages.map(m => (m.id === msgId ? { ...m, read: !currentReadStatus } : m)));
    } catch (error) {
      setAuthError(`Message update error: ${error.message}`);
    }
  };

  // Delete contact message
  const handleDeleteMessage = async msgId => {
    setAuthError(null);
    try {
      await deleteDoc(doc(db, 'messages', msgId));
      setDbMessages(dbMessages.filter(m => m.id !== msgId));
    } catch (error) {
      setAuthError(`Message delete error: ${error.message}`);
    }
  };

  const copyLink = (url, index) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // 1. Loading State
  if (authLoading) {
    return (
      <Container size="xs" py="xl" style={{ marginTop: '10rem' }}>
        <Stack align="center" gap="md">
          <Loader size="lg" color="indigo" />
          <Text size="sm" c="dimmed">
            {translations.loading}
          </Text>
        </Stack>
      </Container>
    );
  }

  // 2. Unauthenticated State (Show login page)
  if (!user) {
    return (
      <Container size="xs" py="xl" style={{ marginTop: '5rem', minHeight: '85vh' }}>
        <Card shadow="lg" radius="md" padding="xl" withBorder>
          <Stack gap="xs" align="center" mb="lg">
            <ThemeIcon size={48} radius="xl" color="indigo" variant="light">
              <IconLock size={24} />
            </ThemeIcon>
            <Title order={2} ta="center">
              {translations.adminLoginTitle}
            </Title>
            <Text c="dimmed" size="xs" ta="center">
              {translations.adminLoginSubtitle}
            </Text>
          </Stack>

          {authError && (
            <Alert icon={<IconAlertCircle size={16} />} title="Authentication Error" color="red" radius="md" mb="md">
              {authError}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <Stack gap="md">
              <TextInput
                label={translations.email}
                placeholder="admin@example.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
                leftSection={<IconMail size={16} style={{ opacity: 0.5 }} />}
              />
              <PasswordInput
                label={translations.password}
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                leftSection={<IconLock size={16} style={{ opacity: 0.5 }} />}
              />

              <Button type="submit" color="indigo" fullWidth mt="xs">
                {translations.signIn}
              </Button>

              <Divider label="OU" labelPosition="center" my="xs" />

              <Button
                variant="default"
                color="gray"
                fullWidth
                leftSection={<IconBrandGoogle size={18} style={{ color: '#4285F4' }} />}
                onClick={handleGoogleLogin}>
                {translations.googleSignIn}
              </Button>

              <Button component={Link} href={`/${locale}`} variant="transparent" size="xs" color="dimmed" fullWidth>
                <IconHome size={14} style={{ marginRight: 4 }} /> {translations.goHome}
              </Button>
            </Stack>
          </form>
        </Card>
      </Container>
    );
  }

  // 3. Authenticated but Unauthorized State (Restrict access)
  if (user.email !== adminEmail) {
    return (
      <Container size="xs" py="xl" style={{ marginTop: '5rem', minHeight: '85vh' }}>
        <Card shadow="lg" radius="md" padding="xl" withBorder style={{ borderColor: 'var(--mantine-color-red-3)' }}>
          <Stack gap="sm" align="center" mb="lg">
            <ThemeIcon size={48} radius="xl" color="red" variant="light">
              <IconAlertCircle size={24} />
            </ThemeIcon>
            <Title order={2} ta="center" c="red.8">
              {translations.restrictedTitle}
            </Title>
            <Text ta="center" size="sm" c="dimmed">
              {translations.restrictedMsg}
            </Text>
          </Stack>

          <Paper withBorder p="md" radius="sm" mb="lg" bg="var(--mantine-color-gray-0)">
            <Text size="xs" c="dimmed" ta="center">
              {translations.signedAs} <strong>{user.email}</strong>
            </Text>
            <Text size="xs" c="red" ta="center" mt={4}>
              Admin requis : <strong>{adminEmail}</strong>
            </Text>
          </Paper>

          <Stack gap="xs">
            <Button color="indigo" variant="light" fullWidth onClick={signOutUser}>
              {translations.switchAccount}
            </Button>
            <Button component={Link} href={`/${locale}`} variant="transparent" size="xs" color="dimmed" fullWidth>
              {translations.goHome}
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  // 4. Authenticated & Authorized State (Dashboard)
  return (
    <Container size="lg" py="xl" style={{ marginTop: '2rem', minHeight: '85vh' }}>
      {/* Header bar */}
      <Card shadow="sm" radius="md" p="md" withBorder mb="lg">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="sm">
            <ThemeIcon size="lg" radius="xl" color="indigo">
              <IconDashboard size={18} />
            </ThemeIcon>
            <div>
              <Title order={3}>{translations.title}</Title>
              <Text size="xs" c="dimmed">
                {translations.dashboard} • <span style={{ color: 'var(--mantine-color-green-7)' }}>{translations.active}</span>
              </Text>
            </div>
          </Group>

          <Group gap="sm">
            <Avatar src={user.photoURL} name={user.displayName || user.email} size="sm" radius="xl" />
            <Text size="sm" fw={500} visibleFrom="sm">
              {user.displayName || user.email.split('@')[0]}
            </Text>
            <ActionIcon
              variant="light"
              color="indigo"
              size="lg"
              radius="md"
              onClick={() => fetchAdminData(false)}
              title="Actualiser les données"
              loading={dbLoading}>
              <IconRefresh size={18} />
            </ActionIcon>
            <ActionIcon variant="light" color="red" size="lg" radius="md" onClick={signOutUser} title={translations.signOut}>
              <IconLogout size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Card>

      <Tabs value={activeTab} onChange={setActiveTab} variant="outline" color="indigo" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="overview" leftSection={<IconDashboard size={16} />}>
            {translations.overview}
          </Tabs.Tab>
          <Tabs.Tab value="projects" leftSection={<IconFolderPlus size={16} />}>
            {translations.projects}
          </Tabs.Tab>
          <Tabs.Tab value="files" leftSection={<IconFiles size={16} />}>
            {translations.files}
          </Tabs.Tab>
          <Tabs.Tab
            value="messages"
            leftSection={<IconMail size={16} />}
            rightSection={
              dbMessages.filter(m => !m.read).length > 0 && (
                <Badge size="xs" color="red" variant="filled" circle>
                  {dbMessages.filter(m => !m.read).length}
                </Badge>
              )
            }>
            Messages
          </Tabs.Tab>
          <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
            {translations.settings}
          </Tabs.Tab>
        </Tabs.List>

        {/* Tab 1: Overview */}
        <Tabs.Panel value="overview">
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Card shadow="xs" p="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed" fw={600}>
                    {translations.statProjects}
                  </Text>
                  <ThemeIcon color="teal" variant="light" radius="md">
                    <IconFolderPlus size={16} />
                  </ThemeIcon>
                </Group>
                <Title order={1} mt="sm">
                  {dbProjects.length + localProjects.length}
                </Title>
                <Text size="xs" c="teal" mt={4}>
                  {dbProjects.length} Firestore + {localProjects.length} Fichiers
                </Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Card shadow="xs" p="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed" fw={600}>
                    {translations.statUploads}
                  </Text>
                  <ThemeIcon color="blue" variant="light" radius="md">
                    <IconFiles size={16} />
                  </ThemeIcon>
                </Group>
                <Title order={1} mt="sm">
                  {uploadedDocs.length}
                </Title>
                <Text size="xs" c="blue" mt={4}>
                  Fichiers en ligne
                </Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Card shadow="xs" p="lg" radius="md" withBorder>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed" fw={600}>
                    Messages reçus
                  </Text>
                  <ThemeIcon color="indigo" variant="light" radius="md">
                    <IconMail size={16} />
                  </ThemeIcon>
                </Group>
                <Title order={1} mt="sm">
                  {dbMessages.length}
                </Title>
                <Text size="xs" c={dbMessages.filter(m => !m.read).length > 0 ? 'red' : 'green'} mt={4}>
                  {dbMessages.filter(m => !m.read).length} non lu(s)
                </Text>
              </Card>
            </Grid.Col>

            {/* Storage usage donut */}
            <Grid.Col span={12}>
              <Card shadow="xs" p="lg" radius="md" withBorder>
                <Group gap="xl" wrap="nowrap" align="center">
                  <RingProgress
                    size={120}
                    thickness={12}
                    roundCaps
                    sections={[{ value: 12, color: 'indigo' }]}
                    label={
                      <Text size="xs" ta="center" fw={700}>
                        12%
                      </Text>
                    }
                  />
                  <div>
                    <Text fw={700} size="lg">
                      Utilisation Firebase Storage
                    </Text>
                    <Text size="sm" c="dimmed">
                      Vous utilisez 1.2 MB sur les 10 MB alloués au plan gratuit de démonstration.
                    </Text>
                    <Progress value={12} color="indigo" size="sm" mt="md" />
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        {/* Tab 2: Projects Manager Form */}
        <Tabs.Panel value="projects">
          <Card shadow="xs" p="lg" radius="md" withBorder>
            <Title order={4} mb="md">
              {translations.addProject}
            </Title>

            {projectSuccess && (
              <Alert icon={<IconCheck size={16} />} title="Success" color="green" radius="md" mb="md">
                {translations.projectSavedSuccess}
              </Alert>
            )}

            <form onSubmit={handleCreateProject}>
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label={translations.projectTitle}
                      placeholder="E.g. Mon Super Portfolio"
                      value={projTitle}
                      onChange={e => setProjTitle(e.target.value)}
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label={translations.projectCategory} value={projCategory} onChange={e => setProjCategory(e.target.value)} required />
                  </Grid.Col>
                </Grid>

                <Textarea
                  label={translations.projectDescription}
                  placeholder="Décrivez en quelques mots..."
                  value={projDesc}
                  onChange={e => setProjDesc(e.target.value)}
                  rows={4}
                  required
                />

                <TextInput
                  label={translations.projectTech}
                  placeholder="React, Next.js, Firebase, Mantine"
                  value={projTech}
                  onChange={e => setProjTech(e.target.value)}
                />

                <TextInput
                  label={translations.projectUrl}
                  placeholder="https://github.com/..."
                  value={projUrl}
                  onChange={e => setProjUrl(e.target.value)}
                />

                {/* Upload project image thumbnail */}
                <Paper withBorder p="md" radius="md">
                  <Text size="sm" fw={600} mb="xs">
                    {translations.uploadThumbnail}
                  </Text>
                  <Group gap="md">
                    <Button variant="default" size="sm" onClick={() => document.getElementById('proj-thumb-input').click()}>
                      {"Choisir l'image"}
                    </Button>
                    <input id="proj-thumb-input" type="file" style={{ display: 'none' }} accept="image/*" onChange={handleThumbnailUpload} />
                    {thumbnailFile && (
                      <Text size="xs" c="dimmed">
                        {thumbnailFile.name} ({(thumbnailFile.size / 1024).toFixed(1)} KB)
                      </Text>
                    )}
                  </Group>

                  {uploading && (
                    <Stack gap="xs" mt="sm">
                      <Progress value={uploadProgress} color="indigo" size="xs" animated />
                      <Text size="xs" ta="right">
                        {uploadProgress}%
                      </Text>
                    </Stack>
                  )}

                  {thumbnailUrl && (
                    <Paper withBorder p="xs" radius="sm" mt="sm" bg="var(--mantine-color-gray-0)">
                      <Text size="xs" c="green" fw={600}>
                        Image en ligne :
                      </Text>
                      <Text size="xs" c="dimmed" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {thumbnailUrl}
                      </Text>
                    </Paper>
                  )}
                </Paper>

                <Button type="submit" color="indigo" mt="sm" disabled={uploading}>
                  {translations.saveProject}
                </Button>
              </Stack>
            </form>

            <Divider my="xl" label="Projets enregistrés dans Firestore" labelPosition="left" />

            {dbLoading ? (
              <Group justify="center" py="md">
                <Loader size="sm" />
              </Group>
            ) : dbProjects.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                Aucun projet dynamique enregistré.
              </Text>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table verticalSpacing="xs" mt="md">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Miniature</Table.Th>
                      <Table.Th>Titre</Table.Th>
                      <Table.Th>Catégorie</Table.Th>
                      <Table.Th>Techs</Table.Th>
                      <Table.Th>Action</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {dbProjects.map((p, idx) => (
                      <Table.Tr key={p.id || idx}>
                        <Table.Td>
                          <Avatar src={p.thumbnailUrl} radius="xs" size="sm" color="indigo" />
                        </Table.Td>
                        <Table.Td fw={500}>{p.title}</Table.Td>
                        <Table.Td>
                          <Badge size="xs" color="indigo" variant="light">
                            {p.category}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Text size="xs" c="dimmed">
                            {p.tech || '-'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDeleteProject(p.id, p.thumbnailPath)}>
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            )}

            <Divider my="xl" label="Projets locaux (Fichiers Markdown en lecture seule)" labelPosition="left" />

            {localProjects.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                {'Aucun projet local trouvé.'}
              </Text>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table verticalSpacing="xs" mt="md">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Miniature</Table.Th>
                      <Table.Th>Titre</Table.Th>
                      <Table.Th>Catégorie</Table.Th>
                      <Table.Th>Source</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {localProjects.map((p, idx) => (
                      <Table.Tr key={p.slug || idx}>
                        <Table.Td>
                          <Avatar src={p.image} radius="xs" size="sm" color="indigo" />
                        </Table.Td>
                        <Table.Td fw={500}>{p.title}</Table.Td>
                        <Table.Td>
                          <Badge size="xs" color="blue" variant="light">
                            {p.category}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge size="xs" color="gray" variant="outline">
                            {'Fichier .md (Lecture seule)'}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            )}
          </Card>
        </Tabs.Panel>

        {/* Tab 3: Storage File Manager */}
        <Tabs.Panel value="files">
          <Card shadow="xs" p="lg" radius="md" withBorder>
            <Title order={4} mb="sm">
              Gestionnaire de documents (Firebase Storage)
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              Uploadez vos CVs, attestations et documents à partager. Les fichiers sont directement stockés dans Firebase Storage.
            </Text>

            <Paper withBorder p="md" radius="md" mb="xl">
              <Group gap="md" align="center">
                <Button variant="default" onClick={() => document.getElementById('admin-doc-input').click()}>
                  Sélectionner un document
                </Button>
                <input id="admin-doc-input" type="file" style={{ display: 'none' }} onChange={e => setDocFile(e.target.files[0])} />
                {docFile && (
                  <Text size="xs" fw={500}>
                    {docFile.name} ({(docFile.size / 1024).toFixed(1)} KB)
                  </Text>
                )}
                {docFile && (
                  <Button color="indigo" onClick={handleDocUpload} loading={docUploading} leftSection={<IconUpload size={14} />}>
                    Uploader
                  </Button>
                )}
              </Group>

              {docUploading && (
                <Stack gap="xs" mt="sm">
                  <Progress value={docProgress} color="indigo" size="xs" animated />
                  <Text size="xs" ta="right">
                    {docProgress}%
                  </Text>
                </Stack>
              )}
            </Paper>

            {uploadedDocs.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                Aucun document téléversé pour le moment.
              </Text>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table verticalSpacing="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Nom du document</Table.Th>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Taille</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {uploadedDocs.map((doc, idx) => (
                      <Table.Tr key={idx}>
                        <Table.Td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Group gap="xs" wrap="nowrap">
                            <IconFileFilled size={18} style={{ color: 'var(--mantine-color-indigo-4)' }} />
                            <Text
                              size="sm"
                              component="a"
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ cursor: 'pointer', color: 'var(--mantine-color-indigo-6)', textDecoration: 'underline' }}>
                              {doc.name}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>{doc.uploadedAt}</Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {doc.size}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              color={copiedIndex === idx ? 'green' : 'gray'}
                              size="sm"
                              onClick={() => copyLink(doc.url, idx)}>
                              {copiedIndex === idx ? <IconCheck size={14} /> : <IconCopy size={14} />}
                            </ActionIcon>
                            <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDocDelete(doc.path, idx)}>
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            )}
          </Card>
        </Tabs.Panel>

        {/* Tab 5: Messages Manager */}
        <Tabs.Panel value="messages">
          <Card shadow="xs" p="lg" radius="md" withBorder>
            <Title order={4} mb="sm">
              {'Boîte de Réception (Firestore)'}
            </Title>
            <Text size="sm" c="dimmed" mb="md">
              {'Consultez les messages envoyés par les visiteurs via le formulaire de contact.'}
            </Text>

            {dbLoading ? (
              <Group justify="center" py="xl">
                <Loader size="sm" />
              </Group>
            ) : dbMessages.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                {'Aucun message reçu pour le moment.'}
              </Text>
            ) : (
              <Stack gap="md">
                {dbMessages.map(msg => (
                  <Paper
                    key={msg.id}
                    withBorder
                    p="md"
                    radius="md"
                    bg={msg.read ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-indigo-0)'}
                    style={{ borderLeft: msg.read ? undefined : '4px solid var(--mantine-color-indigo-6)' }}>
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <Text fw={msg.read ? 600 : 700} size="sm">
                          {msg.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          ({msg.email})
                        </Text>
                        {!msg.read && (
                          <Badge color="indigo" size="xs">
                            {'Nouveau'}
                          </Badge>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                      </Text>
                    </Group>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} mb="md">
                      {msg.message}
                    </Text>
                    <Group justify="flex-end" gap="xs">
                      <Button size="xs" variant="light" color="indigo" onClick={() => handleMarkMessageRead(msg.id, msg.read)}>
                        {msg.read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                      </Button>
                      <ActionIcon variant="light" color="red" size="md" onClick={() => handleDeleteMessage(msg.id)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Card>
        </Tabs.Panel>

        {/* Tab 4: Configuration & Settings */}
        <Tabs.Panel value="settings">
          <Card shadow="xs" p="lg" radius="md" withBorder>
            <Title order={4} mb="md">
              Configuration de Firebase
            </Title>
            <Stack gap="md">
              <Paper withBorder p="md" radius="sm" bg="var(--mantine-color-gray-0)">
                <Text size="sm" fw={600} mb="xs">
                  {"Variables d'environnement actives :"}
                </Text>
                <Grid gutter="xs">
                  <Grid.Col span={4}>
                    <Text size="xs" fw={700}>
                      Auth Domain:
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Text size="xs" c="dimmed">
                      {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
                    </Text>
                  </Grid.Col>

                  <Grid.Col span={4}>
                    <Text size="xs" fw={700}>
                      Project ID:
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Text size="xs" c="dimmed">
                      {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}
                    </Text>
                  </Grid.Col>

                  <Grid.Col span={4}>
                    <Text size="xs" fw={700}>
                      Storage Bucket:
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Text size="xs" c="dimmed">
                      {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
                    </Text>
                  </Grid.Col>

                  <Grid.Col span={4}>
                    <Text size="xs" fw={700}>
                      Admin Email:
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Badge color="indigo" size="xs">
                      {adminEmail}
                    </Badge>
                  </Grid.Col>
                </Grid>
              </Paper>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
