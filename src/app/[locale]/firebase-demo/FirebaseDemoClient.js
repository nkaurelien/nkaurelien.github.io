'use client';

import { useState, useEffect } from 'react';
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
  IconFileCode,
} from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import { uploadFile, deleteFile } from '@/lib/storage';

const t = {
  fr: {
    title: 'Intégration Firebase',
    subtitle: 'Démonstration de Firebase Authentication & Storage',
    authTitle: 'Authentification',
    authSubtitle: "Testez l'inscription, connexion et Google Auth",
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    signIn: 'Se connecter',
    signUp: "S'inscrire",
    signOut: 'Se déconnecter',
    or: 'ou continuer avec',
    google: 'Se connecter avec Google',
    toggleSignUp: "Pas encore de compte ? S'inscrire",
    toggleSignIn: 'Déjà un compte ? Se connecter',
    storageTitle: 'Firebase Storage',
    storageSubtitle: 'Uploadez des fichiers en temps réel',
    selectFile: 'Sélectionner un fichier',
    upload: 'Uploader sur Firebase',
    progress: "Progression de l'upload",
    filesTitle: 'Fichiers uploadés',
    noFiles: 'Aucun fichier uploadé dans cette session.',
    copyUrl: "Copier l'URL",
    copied: 'URL copiée !',
    delete: 'Supprimer',
    loading: 'Chargement...',
    welcome: 'Bienvenue,',
    anonymous: 'Utilisateur connecté',
    authRequired: 'Veuillez vous connecter pour tester le module de stockage.',
    successUpload: 'Fichier uploadé avec succès !',
    successDelete: 'Fichier supprimé avec succès !',
    successAuth: 'Authentification réussie !',
    successSignOut: 'Déconnexion réussie !',
  },
  en: {
    title: 'Firebase Integration',
    subtitle: 'Firebase Authentication & Storage Demonstration',
    authTitle: 'Authentication',
    authSubtitle: 'Test sign-up, sign-in, and Google Auth',
    email: 'Email address',
    password: 'Password',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    or: 'or continue with',
    google: 'Sign in with Google',
    toggleSignUp: "Don't have an account? Sign Up",
    toggleSignIn: 'Already have an account? Sign In',
    storageTitle: 'Firebase Storage',
    storageSubtitle: 'Upload files in real-time',
    selectFile: 'Select a file',
    upload: 'Upload to Firebase',
    progress: 'Upload progress',
    filesTitle: 'Uploaded Files',
    noFiles: 'No files uploaded in this session.',
    copyUrl: 'Copy URL',
    copied: 'URL copied!',
    delete: 'Delete',
    loading: 'Loading...',
    welcome: 'Welcome,',
    anonymous: 'Logged in user',
    authRequired: 'Please sign in to test the storage upload module.',
    successUpload: 'File uploaded successfully!',
    successDelete: 'File deleted successfully!',
    successAuth: 'Authentication successful!',
    successSignOut: 'Signed out successfully!',
  },
};

export default function FirebaseDemoClient({ locale }) {
  const isFr = locale === 'fr';
  const translations = t[locale] || t.en;

  const { user, loading: authLoading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOutUser } = useAuth();

  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);

  // Storage states
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [storageError, setStorageError] = useState(null);
  const [storageSuccess, setStorageSuccess] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Load files list from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('firebase_demo_files');
    if (saved) {
      try {
        setUploadedFiles(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved files', e);
      }
    }
  }, []);

  const saveFilesToLocalStorage = files => {
    localStorage.setItem('firebase_demo_files', JSON.stringify(files));
  };

  const handleEmailAuth = async e => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (!email || !password) {
      setAuthError('Email and Password are required.');
      return;
    }
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setAuthSuccess(translations.successAuth);
      } else {
        await signInWithEmail(email, password);
        setAuthSuccess(translations.successAuth);
      }
      setPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    try {
      await signInWithGoogle();
      setAuthSuccess(translations.successAuth);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    try {
      await signOutUser();
      setAuthSuccess(translations.successSignOut);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleFileChange = e => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStorageError(null);
      setStorageSuccess(null);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setStorageError('Please select a file first.');
      return;
    }
    if (!user) {
      setStorageError(translations.authRequired);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setStorageError(null);
    setStorageSuccess(null);

    const uploadPath = `users/${user.uid}/uploads/${Date.now()}_${file.name}`;

    try {
      const downloadURL = await uploadFile(file, uploadPath, progress => {
        setUploadProgress(progress);
      });

      const newFileObj = {
        name: file.name,
        url: downloadURL,
        path: uploadPath,
        size: (file.size / 1024).toFixed(1) + ' KB',
        uploadedAt: new Date().toLocaleTimeString(),
      };

      const updatedList = [newFileObj, ...uploadedFiles];
      setUploadedFiles(updatedList);
      saveFilesToLocalStorage(updatedList);

      setStorageSuccess(translations.successUpload);
      setFile(null);
      // Reset input element
      const fileInput = document.getElementById('demo-file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setStorageError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (path, index) => {
    setStorageError(null);
    setStorageSuccess(null);
    try {
      await deleteFile(path);
      const updatedList = uploadedFiles.filter((_, i) => i !== index);
      setUploadedFiles(updatedList);
      saveFilesToLocalStorage(updatedList);
      setStorageSuccess(translations.successDelete);
    } catch (err) {
      setStorageError(err.message);
    }
  };

  const copyToClipboard = (url, index) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Container size="lg" py="xl" style={{ marginTop: '2rem', minHeight: '80vh' }}>
      <Stack gap="xs" mb="xl">
        <Group align="center" gap="sm">
          <IconFileCode size={34} style={{ color: 'var(--mantine-color-indigo-6)' }} />
          <Title order={1}>{translations.title}</Title>
        </Group>
        <Text c="dimmed" size="lg">
          {translations.subtitle}
        </Text>
      </Stack>

      <Grid gutter="xl">
        {/* LEFT COLUMN: AUTHENTICATION */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Group justify="space-between">
                <Text fw={700}>{translations.authTitle}</Text>
                {authLoading && <Loader size="xs" />}
              </Group>
            </Card.Section>

            <Stack gap="md" mt="md">
              {authError && (
                <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" radius="md">
                  {authError}
                </Alert>
              )}

              {authSuccess && (
                <Alert icon={<IconCheck size={16} />} title="Success" color="green" radius="md">
                  {authSuccess}
                </Alert>
              )}

              {user ? (
                // LOGGED IN VIEW
                <Stack align="center" gap="md" py="md">
                  <Avatar src={user.photoURL} name={user.displayName || user.email} size="xl" radius="xl" color="indigo" />
                  <div style={{ textAlign: 'center' }}>
                    <Text fw={600} size="lg">
                      {translations.welcome} {user.displayName || user.email.split('@')[0]}
                    </Text>
                    <Text c="dimmed" size="sm">
                      {user.email}
                    </Text>
                  </div>

                  <Paper withBorder p="xs" radius="sm" style={{ width: '100%' }}>
                    <Text size="xs" c="dimmed">
                      <strong>UID:</strong> {user.uid}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      <strong>Provider:</strong>{' '}
                      <Badge size="xs" color="blue">
                        {user.providerData[0]?.providerId || 'password'}
                      </Badge>
                    </Text>
                  </Paper>

                  <Button color="red" variant="light" fullWidth leftSection={<IconLogout size={16} />} onClick={handleSignOut}>
                    {translations.signOut}
                  </Button>
                </Stack>
              ) : (
                // LOGGED OUT/FORM VIEW
                <form onSubmit={handleEmailAuth}>
                  <Stack gap="sm">
                    <TextInput
                      label={translations.email}
                      placeholder="votre.email@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      leftSection={<IconMail size={16} style={{ opacity: 0.5 }} />}
                    />
                    <PasswordInput
                      label={translations.password}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      leftSection={<IconLock size={16} style={{ opacity: 0.5 }} />}
                    />

                    <Button type="submit" color="indigo" fullWidth mt="xs">
                      {isSignUp ? translations.signUp : translations.signIn}
                    </Button>

                    <Divider label={translations.or} labelPosition="center" my="xs" />

                    <Button
                      variant="default"
                      color="gray"
                      fullWidth
                      leftSection={<IconBrandGoogle size={18} style={{ color: '#4285F4' }} />}
                      onClick={handleGoogleAuth}>
                      {translations.google}
                    </Button>

                    <Button variant="transparent" size="xs" color="dimmed" fullWidth onClick={() => setIsSignUp(!isSignUp)}>
                      {isSignUp ? translations.toggleSignIn : translations.toggleSignUp}
                    </Button>
                  </Stack>
                </form>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* RIGHT COLUMN: STORAGE */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Text fw={700}>{translations.storageTitle}</Text>
            </Card.Section>

            <Stack gap="md" mt="md">
              {storageError && (
                <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" radius="md">
                  {storageError}
                </Alert>
              )}

              {storageSuccess && (
                <Alert icon={<IconCheck size={16} />} title="Success" color="green" radius="md">
                  {storageSuccess}
                </Alert>
              )}

              {!user && (
                <Paper p="lg" withBorder bg="var(--mantine-color-gray-0)" radius="md">
                  <Stack align="center" gap="xs">
                    <IconLock size={32} style={{ color: 'var(--mantine-color-gray-5)' }} />
                    <Text size="sm" ta="center" c="dimmed">
                      {translations.authRequired}
                    </Text>
                  </Stack>
                </Paper>
              )}

              {user && (
                <Stack gap="md">
                  <div
                    style={{
                      border: '2px dashed var(--mantine-color-indigo-2)',
                      borderRadius: 'var(--mantine-radius-md)',
                      padding: '1.5rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--mantine-color-indigo-0)',
                      cursor: 'pointer',
                    }}
                    onClick={() => document.getElementById('demo-file-input').click()}>
                    <input id="demo-file-input" type="file" style={{ display: 'none' }} onChange={handleFileChange} />
                    <IconUpload size={32} style={{ color: 'var(--mantine-color-indigo-6)', marginBottom: '0.5rem' }} />
                    <Text size="sm" fw={500}>
                      {file ? file.name : translations.selectFile}
                    </Text>
                    {file && (
                      <Text size="xs" c="dimmed" mt={4}>
                        {(file.size / 1024).toFixed(1)} KB
                      </Text>
                    )}
                  </div>

                  <Button onClick={handleFileUpload} loading={uploading} disabled={!file} color="indigo" leftSection={<IconUpload size={16} />}>
                    {translations.upload}
                  </Button>

                  {uploading && (
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text size="xs" c="dimmed">
                          {translations.progress}
                        </Text>
                        <Text size="xs" fw={700}>
                          {uploadProgress}%
                        </Text>
                      </Group>
                      <Progress value={uploadProgress} color="indigo" animated />
                    </Stack>
                  )}
                </Stack>
              )}

              <Divider my="sm" label={translations.filesTitle} labelPosition="left" />

              {uploadedFiles.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  {translations.noFiles}
                </Text>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table verticalSpacing="xs">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Size</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {uploadedFiles.map((f, i) => (
                        <Table.Tr key={i}>
                          <Table.Td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <Group gap="xs" wrap="nowrap">
                              {f.name.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                <Avatar src={f.url} size="xs" radius="xs" />
                              ) : (
                                <IconFileFilled size={16} style={{ color: 'var(--mantine-color-gray-5)' }} />
                              )}
                              <Text size="sm" component="a" href={f.url} target="_blank" rel="noopener noreferrer" style={{ cursor: 'pointer' }}>
                                {f.name}
                              </Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {f.size}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                variant="light"
                                color={copiedIndex === i ? 'green' : 'gray'}
                                size="sm"
                                onClick={() => copyToClipboard(f.url, i)}
                                title={translations.copyUrl}>
                                {copiedIndex === i ? <IconCheck size={14} /> : <IconCopy size={14} />}
                              </ActionIcon>
                              {user && (
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  size="sm"
                                  onClick={() => handleFileDelete(f.path, i)}
                                  title={translations.delete}>
                                  <IconTrash size={14} />
                                </ActionIcon>
                              )}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
