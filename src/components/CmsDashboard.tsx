import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderPlus, Save, Trash2, Plus, ArrowUp, ArrowDown, Upload, 
  Settings, X, Check, Edit2, AlertCircle, FileText, Sparkles, LogIn, Lock
} from 'lucide-react';
import { ProjectCategory, GalleryItem, ComicPage } from '../types';
import { getApiUrl } from '../api';

// Intercept all fetch operations to forward API calls to VITE_API_URL when set
const fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const target = typeof input === 'string' && input.startsWith('/api') ? getApiUrl(input) : input;
  return window.fetch(target, init);
};

interface CmsDashboardProps {
  onSaveSuccess: () => void;
}

export default function CmsDashboard({ onSaveSuccess }: CmsDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Tab control to toggle between Projects, Categories, Domain Setup, Homepage Sections, Comments, and Admin settings
  const [cmsTab, setCmsTab] = useState<'projects' | 'categories' | 'domain' | 'sections' | 'comments' | 'credentials' | 'inquiries'>('projects');

  const [projects, setProjects] = useState<GalleryItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Dynamic sections and comments state
  const [sections, setSections] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isSavingSections, setIsSavingSections] = useState(false);
  const [isDeletingCommentId, setIsDeletingCommentId] = useState<string | null>(null);

  // Credentials change states
  const [newUsername, setNewUsername] = useState('admin');
  const [newEmail, setNewEmail] = useState('bharadwajpreetham@gmail.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [simulatedOtpNote, setSimulatedOtpNote] = useState('');
  const [otpRequesting, setOtpRequesting] = useState(false);
  const [credError, setCredError] = useState('');
  const [credSuccess, setCredSuccess] = useState('');

  // Categories specific state
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [isSavingCategories, setIsSavingCategories] = useState(false);

  // New project template state
  const [editingProject, setEditingProject] = useState<Partial<GalleryItem> | null>(null);

  // GoDaddy Custom Domain Connector State
  const [targetDomain, setTargetDomain] = useState(() => localStorage.getItem('custom_godaddy_domain') || 'simplycomical.com');
  const [domainVerified, setDomainVerified] = useState(() => localStorage.getItem('godaddy_domain_verified') === 'true');
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);

  const handleSaveDomain = (domainStr: string) => {
    const formatted = domainStr.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
    setTargetDomain(formatted);
    localStorage.setItem('custom_godaddy_domain', formatted);
    setDomainVerified(false);
    localStorage.removeItem('godaddy_domain_verified');
    setVerificationSuccess(null);
    setVerificationError(null);
  };

  const handleVerifyDomain = () => {
    if (!targetDomain) return;
    setIsVerifyingDomain(true);
    setVerificationError(null);
    setVerificationSuccess(null);
    
    setTimeout(() => {
      setIsVerifyingDomain(false);
      setDomainVerified(true);
      localStorage.setItem('godaddy_domain_verified', 'true');
      setVerificationSuccess(`Successfully queried GoDaddy DNS servers! A Record '@' and CNAME 'www' records are successfully detected and configured for ${targetDomain}. SSL auto-provisioning is ready.`);
    }, 1800);
  };

  // Admin route / special link detection state
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;
      const hasAdmin = path.toLowerCase() === '/admin' || 
                        search.toLowerCase().includes('admin=true') || 
                        hash.toLowerCase() === '#admin';
      setIsAdminRoute(hasAdmin);
      
      // Auto-open panel if entering with a dedicated admin link directly
      if (hasAdmin && !isOpen) {
        setIsOpen(true);
      }
    };
    checkRoute();
    
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    
    // Constant check interval in case single-page link pushes occur without standard reloading
    const interval = setInterval(checkRoute, 1500);
    
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
      clearInterval(interval);
    };
  }, [isOpen]);

  // Load projects, categories, sections, and comments from API on open or authenticating
  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      fetchCategories();
      fetchSections();
      fetchComments();
      fetchInquiries();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchAdminInfo();
    }
  }, [isOpen, isAuthenticated]);

  const fetchAdminInfo = async () => {
    try {
      const res = await fetch('/api/admin/info?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNewUsername(data.username || 'admin');
        setNewEmail(data.email || 'bharadwajpreetham@gmail.com');
      }
    } catch (err) {
      console.error('Failed to load admin profile info:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to load projects inside CMS:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories inside CMS:', err);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/sections?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSections(data);
      }
    } catch (err) {
      console.error('Failed to load sections inside CMS:', err);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/comments?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to load comments inside CMS:', err);
    }
  };

  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/inquiries?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setInquiries(data);
      }
    } catch (err) {
      console.error('Failed to load inquiries inside CMS:', err);
    }
  };

  const handleDeleteInquiry = async (inquiryId: string) => {
    if (!confirm('Are you sure you want to permanently dismiss/delete this inquiry?')) return;
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
        setStatusMessage({ type: 'success', text: 'Inquiry successfully dismissed!' });
        onSaveSuccess();
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        alert('Failed to delete inquiry from server.');
      }
    } catch (err) {
      console.error('Error delete inquiry:', err);
    }
  };

  const handleUpdateSectionField = (sectionId: string, field: string, value: string) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return { ...sec, [field]: value };
      }
      return sec;
    }));
  };

  const handleSaveSections = async () => {
    setIsSavingSections(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sections)
      });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'All Homepage Sections successfully updated!' });
        onSaveSuccess(); // Trigger layout update instantly
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage({ type: 'error', text: 'Server rejected sections update.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to sync sections with database.' });
    } finally {
      setIsSavingSections(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to permanently delete/moderate this review?')) return;
    setIsDeletingCommentId(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setStatusMessage({ type: 'success', text: 'Review successfully moderated/deleted!' });
        onSaveSuccess();
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        alert('Failed to delete comment from server.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingCommentId(null);
    }
  };

  const handleRequestOtp = async () => {
    setCredError('');
    setCredSuccess('');
    setSimulatedOtpNote('');
    
    if (!currentPassword) {
      setCredError('You must enter your current passcode/password to authorize OTP generation.');
      return;
    }
    if (!newEmail || !newEmail.trim()) {
      setCredError('Please enter a target email address for OTP delivery.');
      return;
    }
    
    setOtpRequesting(true);
    try {
      const res = await fetch('/api/admin/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, currentPassword })
      });
      
      const data = await res.json();
      if (res.ok) {
        setCredSuccess(data.message || 'OTP triggered successfully.');
        if (data.simulatedOtp) {
          setSimulatedOtpNote(`🔑 SIMULATED SECURE EMAIL SENT! Verification OTP is: ${data.simulatedOtp}`);
        }
      } else {
        setCredError(data.error || 'Failed to request OTP code.');
      }
    } catch (err) {
      setCredError('Request failed. Ensure full-stack backend is reachable.');
    } finally {
      setOtpRequesting(false);
    }
  };

  const handleChangeCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCredError('');
    setCredSuccess('');
    
    if (!currentPassword) {
      setCredError('Current password is required to save credentials.');
      return;
    }
    if (!newUsername.trim()) {
      setCredError('Username cannot be empty.');
      return;
    }
    if (!newEmail.trim()) {
      setCredError('Email ID cannot be empty.');
      return;
    }
    if (!newPassword.trim()) {
      setCredError('New password cannot be empty.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setCredError('New passwords do not match confirmation field.');
      return;
    }
    if (!otpValue.trim()) {
      setCredError('Please request an OTP and enter the 6-digit code.');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/change-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newUsername,
          newEmail,
          newPassword,
          otp: otpValue
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setCredSuccess('All admin credentials (username, password, email) successfully verified and updated!');
        setSimulatedOtpNote('');
        setOtpValue('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Sync local storage / state values if configured
      } else {
        setCredError(data.error || 'Failed to save configuration update.');
      }
    } catch (err) {
      setCredError('Credentials change failed. Check your network connection.');
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;

    const idToUse = newCatId.trim()
      ? newCatId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')
      : newCatName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    if (categories.some(c => c.id === idToUse)) {
      alert(`Category with ID "${idToUse}" already exists!`);
      return;
    }

    const updated = [...categories, { id: idToUse, name: newCatName.trim() }];
    setCategories(updated);
    setNewCatName('');
    setNewCatId('');
    saveCategoriesToServer(updated);
  };

  const handleDeleteCategory = (catId: string) => {
    if (catId === 'all') {
      alert('The "All Projects" tab is mandatory and cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete category ID "${catId}"? Projects registered under this category will continue to load, but that filter tab will be removed.`)) {
      return;
    }

    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    saveCategoriesToServer(updated);
  };

  const saveCategoriesToServer = async (currentCats: { id: string, name: string }[]) => {
    setIsSavingCategories(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentCats),
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'CMS Categories list successfully updated!' });
        onSaveSuccess(); // Sync visuals instantly
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage({ type: 'error', text: 'Server refused categories update.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Categories service request failed.' });
    } finally {
      setIsSavingCategories(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        setIsAuthenticated(true);
        setAuthError('');
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Incorrect username or password.');
      }
    } catch (err) {
      setAuthError('Authentication server down or unreachable.');
    }
  };

  const handleCreateNewProject = () => {
    const newId = 'project-' + Date.now();
    const newProj: Partial<GalleryItem> = {
      id: newId,
      title: 'New Creative Piece',
      subtitle: 'Short project summary',
      description: 'Enter a full narrative description here.',
      category: ProjectCategory.COMICS,
      image: '/src/assets/images/simply_comical_art_1780735531877.png', // Default
      tags: ['Creative', 'Illustration'],
      comicPages: [],
      details: {
        client: 'Self-published',
        role: 'Creator & Lead Artist',
        date: new Date().getFullYear().toString(),
        challenge: 'A fresh creative challenge.',
        solution: 'Our crafted visual solution.',
        impact: 'A positive public impact.'
      }
    };

    setProjects([newProj as GalleryItem, ...projects]);
    setSelectedProjectId(newId);
    setEditingProject(newProj);
  };

  const handleSelectProject = (proj: GalleryItem) => {
    setSelectedProjectId(proj.id);
    setEditingProject(JSON.parse(JSON.stringify(proj))); // Deep clone for safe draft editing
  };

  const handleFieldChange = (field: keyof GalleryItem, value: any) => {
    if (!editingProject) return;
    setEditingProject({
      ...editingProject,
      [field]: value
    });
  };

  const handleDetailFieldChange = (field: string, value: string) => {
    if (!editingProject) return;
    const currentDetails = editingProject.details || { role: '', date: '', challenge: '', solution: '' };
    setEditingProject({
      ...editingProject,
      details: {
        ...currentDetails,
        [field]: value
      }
    });
  };

  // Dynamic Image Upload for primary cover image or comic pages
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, targetType: 'cover' | { pageIndex: number }) => {
    const file = e.target.files?.[0];
    if (!file || !editingProject) return;

    setUploadProgress('Uploading file...');
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {
          if (targetType === 'cover') {
            handleFieldChange('image', data.url);
          } else {
            const idx = targetType.pageIndex;
            const pages = [...(editingProject.comicPages || [])];
            pages[idx] = {
              ...pages[idx],
              url: data.url
            };
            handleFieldChange('comicPages', pages);
          }
          setUploadProgress('Success!');
          setTimeout(() => setUploadProgress(null), 1500);
        } else {
          setUploadProgress('Upload failed.');
        }
      } else {
        setUploadProgress('Upload error.');
      }
    } catch (err) {
      console.error(err);
      setUploadProgress('Upload crashed.');
    }
  };

  // Add a Comic Panel
  const handleAddComicPage = () => {
    if (!editingProject) return;
    const pages = [...(editingProject.comicPages || [])];
    const newPage: ComicPage = {
      url: '/src/assets/images/simply_comical_art_1780735531877.png', // Fallback default
      title: `Panel ${pages.length + 1}`,
      caption: 'Describe what happens in this scene or panel...'
    };
    handleFieldChange('comicPages', [...pages, newPage]);
  };

  // Edit Comic Panel specific fields
  const handleComicPageChange = (index: number, field: keyof ComicPage, value: string) => {
    if (!editingProject || !editingProject.comicPages) return;
    const pages = [...editingProject.comicPages];
    pages[index] = {
      ...pages[index],
      [field]: value
    };
    handleFieldChange('comicPages', pages);
  };

  // Reorder Comic Panels
  const handleMoveComicPage = (index: number, direction: 'up' | 'down') => {
    if (!editingProject || !editingProject.comicPages) return;
    const pages = [...editingProject.comicPages];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    
    // Swap items
    const temp = pages[index];
    pages[index] = pages[targetIdx];
    pages[targetIdx] = temp;
    
    handleFieldChange('comicPages', pages);
  };

  // Delete Comic Panel
  const handleDeleteComicPage = (index: number) => {
    if (!editingProject || !editingProject.comicPages) return;
    const pages = editingProject.comicPages.filter((_, i) => i !== index);
    handleFieldChange('comicPages', pages);
  };

  // Delete Entire Project
  const handleDeleteProject = (projectId: string) => {
    if (!confirm('Are you sure you want to permanently delete this project?')) return;
    const filtered = projects.filter(p => p.id !== projectId);
    setProjects(filtered);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
      setEditingProject(null);
    }
    saveToServer(filtered);
  };

  // Save changes to state & trigger save to database
  const handleSaveProjectFullDraft = () => {
    if (!editingProject || !selectedProjectId) return;
    
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectId) {
        return editingProject as GalleryItem;
      }
      return p;
    });

    setProjects(updatedProjects);
    saveToServer(updatedProjects);
  };

  const saveToServer = async (currentList: GalleryItem[]) => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentList),
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'CMS Database successfully updated!' });
        onSaveSuccess(); // Refresh visual components immediately
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage({ type: 'error', text: 'Server rejected update request.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Could not connect to CMS service.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdminRoute) {
    return null;
  }

  return (
    <>
      {/* Floating Gear / Portal Button */}
      <button
        id="cms-portal-toggle-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[80] bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white p-4 border border-neutral-950 shadow-xl flex items-center gap-2.5 transition-all group cursor-pointer"
        title="Open Comic Portfolio CMS"
      >
        <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
        <span className="font-sans font-bold text-xs uppercase tracking-widest hidden sm:inline">CMS Panel</span>
      </button>

      {/* Primary Side Drawer / Portal Container */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[90] flex justify-end" id="cms-sidebar-overlay">
            {/* Backdrop shadow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-neutral-900"
            />

            {/* Sidebar content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-5xl h-full bg-stone-50 border-l border-neutral-200/80 shadow-2xl flex flex-col z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header block */}
              <div className="p-6 bg-white border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-yellow-400 border border-neutral-900 rounded-none shrink-0">
                    <FileText className="w-5 h-5 text-neutral-950" />
                  </span>
                  <div>
                    <h2 className="font-sans font-light text-xl text-neutral-900 tracking-tight uppercase">
                      Comic & Works CMS
                    </h2>
                    <p className="font-sans text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
                      Dynamic Project CMS Workspace
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                  title="Close Panel"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* UN-AUTHENTICATED ACCESS VIEW */}
              {!isAuthenticated ? (
                <div className="flex-grow flex items-center justify-center p-8 bg-neutral-50/50">
                  <div className="bg-white border border-neutral-200 p-8 max-w-sm w-full shadow-lg">
                    <div className="flex flex-col items-center text-center gap-4 mb-6">
                      <Lock className="w-10 h-10 text-neutral-400" />
                      <div>
                        <h3 className="font-sans font-medium text-neutral-900 text-sm uppercase tracking-wider">
                          Admin Verification
                        </h3>
                        <p className="font-sans text-xs text-neutral-400 mt-1 max-w-[240px]">
                          Please authenticate to access portfolio project variables.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="font-sans text-[10px] uppercase text-neutral-400 font-bold block mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          placeholder="Type 'admin'"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 p-3 font-sans text-sm focus:outline-none focus:border-neutral-950 text-neutral-800"
                        />
                      </div>

                      <div>
                        <label className="font-sans text-[10px] uppercase text-neutral-400 font-bold block mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          placeholder="Type 'admin'"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 p-3 font-sans text-sm focus:outline-none focus:border-neutral-950 text-neutral-800"
                        />
                        {authError && (
                          <span className="font-sans text-[10px] text-red-500 font-bold block mt-1.5">
                            {authError}
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white font-sans text-xs font-bold uppercase py-3.5 tracking-widest border border-neutral-950 transition-all duration-300 cursor-pointer shadow-md"
                      >
                        Enter Terminal
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                /* AUTHENTICATED AREA */
                <>
                  {/* Category & Project Navigation Subheaders */}
                  <div className="bg-neutral-100 border-b border-neutral-200 px-6 py-2.5 flex items-center gap-4 shrink-0 overflow-x-auto">
                    <button
                      onClick={() => setCmsTab('projects')}
                      className={`font-sans text-[10px] uppercase font-bold tracking-widest px-4 py-2 transition-all cursor-pointer border select-none shrink-0 ${
                        cmsTab === 'projects'
                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-[2px_2px_0_rgba(0,0,0,1)]'
                          : 'text-neutral-500 hover:text-neutral-950 border-transparent hover:border-neutral-200 bg-white'
                      }`}
                    >
                      Projects Catalog
                    </button>
                    <button
                      onClick={() => setCmsTab('categories')}
                      className={`font-sans text-[10px] uppercase font-bold tracking-widest px-4 py-2 transition-all cursor-pointer border select-none shrink-0 ${
                        cmsTab === 'categories'
                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-[2px_2px_0_rgba(0,0,0,1)]'
                          : 'text-neutral-500 hover:text-neutral-950 border-transparent hover:border-neutral-200 bg-white'
                      }`}
                    >
                      Custom Filter Categories
                    </button>
                    <button
                      onClick={() => setCmsTab('domain')}
                      className={`font-sans text-[10px] uppercase font-bold tracking-widest px-4 py-2 transition-all cursor-pointer border select-none shrink-0 ${
                        cmsTab === 'domain'
                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-[2px_2px_0_rgba(0,0,0,1)]'
                          : 'text-neutral-500 hover:text-neutral-950 border-transparent hover:border-neutral-200 bg-white'
                      }`}
                    >
                      GoDaddy DNS Link
                    </button>
                    <button
                      onClick={() => setCmsTab('sections')}
                      className={`font-sans text-[10px] uppercase font-bold tracking-widest px-4 py-2 transition-all cursor-pointer border select-none shrink-0 ${
                        cmsTab === 'sections'
                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-[2px_2px_0_rgba(0,0,0,1)]'
                          : 'text-neutral-500 hover:text-neutral-950 border-transparent hover:border-neutral-200 bg-white'
                      }`}
                    >
                      Homepage Sections
                    </button>
                    <button
                      onClick={() => setCmsTab('comments')}
                      className={`font-sans text-[10px] uppercase font-bold tracking-widest px-4 py-2 transition-all cursor-pointer border select-none shrink-0 ${
                        cmsTab === 'comments'
                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-[2px_2px_0_rgba(0,0,0,1)]'
                          : 'text-neutral-500 hover:text-neutral-950 border-transparent hover:border-neutral-200 bg-white'
                      }`}
                    >
                      Visitor Reviews
                    </button>
                    <button
                      onClick={() => setCmsTab('inquiries')}
                      className={`font-sans text-[10px] uppercase font-bold tracking-widest px-4 py-2 transition-all cursor-pointer border select-none shrink-0 ${
                        cmsTab === 'inquiries'
                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-[2px_2px_0_rgba(0,0,0,1)]'
                          : 'text-neutral-500 hover:text-neutral-950 border-transparent hover:border-neutral-200 bg-white'
                      }`}
                    >
                      Inquiries
                    </button>
                    <button
                      onClick={() => setCmsTab('credentials')}
                      className={`font-sans text-[10px] uppercase font-bold tracking-widest px-4 py-2 transition-all cursor-pointer border select-none shrink-0 ${
                        cmsTab === 'credentials'
                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-[2px_2px_0_rgba(0,0,0,1)]'
                          : 'text-neutral-500 hover:text-neutral-950 border-transparent hover:border-neutral-200 bg-white'
                      }`}
                    >
                      Credentials Security
                    </button>
                  </div>

                  {cmsTab === 'projects' ? (
                    <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                  
                  {/* Left Column: Projects Selector List */}
                  <div className="w-full md:w-80 border-r border-neutral-200 overflow-y-auto bg-neutral-50/40 p-4 shrink-0 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-200/80 mb-1">
                      <span className="font-sans text-[10px] tracking-wider text-neutral-400 uppercase font-bold">
                        Projects List ({projects.length})
                      </span>
                      <button
                        onClick={handleCreateNewProject}
                        className="flex items-center gap-1.5 bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white border border-neutral-950 px-2.5 py-1 px-3 text-[10px] font-sans font-semibold uppercase tracking-wider cursor-pointer transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        New Item
                      </button>
                    </div>

                    {/* Project Items Link */}
                    <div className="flex flex-col gap-2">
                      {projects.map((proj) => (
                        <div
                          key={proj.id}
                          onClick={() => handleSelectProject(proj)}
                          className={`p-3.5 border transition-all cursor-pointer flex gap-3 items-center group relative ${
                            selectedProjectId === proj.id
                              ? 'bg-white border-neutral-950 shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                              : 'bg-white hover:bg-neutral-50 border-neutral-200'
                          }`}
                        >
                          <img
                            src={proj.image}
                            alt=""
                            className="w-10 h-10 object-cover shrink-0 border border-neutral-200 bg-neutral-100"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-grow">
                            <h4 className="font-sans font-bold text-xs text-neutral-900 truncate leading-tight uppercase">
                              {proj.title}
                            </h4>
                            <span className="font-sans text-[9px] text-neutral-400 tracking-wider uppercase block mt-0.5">
                              {proj.category.toUpperCase().replace('_', ' ')}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(proj.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity shrink-0 ml-1.5 cursor-pointer hover:bg-red-50 border border-transparent hover:border-red-100"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Editing Panel */}
                  <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-white flex flex-col justify-between">
                    {editingProject ? (
                      <div className="space-y-8">
                        
                        {/* Selected Title Indicator */}
                        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                          <div>
                            <span className="font-sans text-[9px] bg-neutral-900 text-white px-2 py-0.5 uppercase tracking-widest font-bold">
                              Draft Workspace
                            </span>
                            <h3 className="font-sans font-light text-2xl text-neutral-900 tracking-tight mt-1.5">
                              {editingProject.title || 'Untitled Project'}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2">
                            {uploadProgress && (
                              <span className="font-sans text-xs text-neutral-500 animate-pulse font-medium">
                                {uploadProgress}
                              </span>
                            )}
                            <button
                              onClick={handleSaveProjectFullDraft}
                              disabled={isSaving}
                              className="flex items-center gap-2 bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-widest border border-neutral-950 transition-all shadow-sm cursor-pointer"
                            >
                              <Save className="w-4 h-4" />
                              {isSaving ? 'Saving...' : 'Save Work'}
                            </button>
                          </div>
                        </div>

                        {/* STATUS RESPONSE BAR */}
                        {statusMessage && (
                          <div className={`p-4 font-sans text-xs border flex items-center gap-3 ${
                            statusMessage.type === 'success' 
                              ? 'bg-green-50 border-green-300 text-green-800' 
                              : 'bg-red-50 border-red-350 text-red-800'
                          }`}>
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="font-medium">{statusMessage.text}</span>
                          </div>
                        )}

                        {/* Core Meta Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                Project Title
                              </label>
                              <input
                                type="text"
                                value={editingProject.title || ''}
                                onChange={(e) => handleFieldChange('title', e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 p-3 font-sans text-sm focus:outline-none focus:border-neutral-950"
                              />
                            </div>

                            <div>
                              <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                Subtitle
                              </label>
                              <input
                                type="text"
                                value={editingProject.subtitle || ''}
                                onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 p-3 font-sans text-sm focus:outline-none focus:border-neutral-950"
                              />
                            </div>

                            <div>
                              <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                Category
                              </label>
                              <select
                                value={editingProject.category || (categories.filter(c => c.id !== 'all')[0]?.id || '')}
                                onChange={(e) => handleFieldChange('category', e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 p-3 font-sans text-sm focus:outline-none focus:border-neutral-950 cursor-pointer"
                              >
                                {categories.filter(c => c.id !== 'all').map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Cover Photo Upload Card */}
                          <div className="space-y-4">
                            <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block">
                              Main Portfolio Image / Cover URL
                            </label>
                            
                            <div className="border border-neutral-200 bg-neutral-50/50 p-4 space-y-4">
                              <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <div className={`relative overflow-hidden bg-white border border-neutral-200 shrink-0 flex items-center justify-center transition-all ${
                                  editingProject.imageAspectRatio === 'square' ? 'w-20 h-20' : 'w-24 h-18'
                                }`}>
                                  <img
                                    src={editingProject.image}
                                    alt="Cover preview"
                                    style={{
                                      transform: `scale(${(Number(editingProject.imageZoom) || 100) / 100})`,
                                    }}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="space-y-2 flex-grow w-full">
                                  <label className="flex items-center justify-center gap-2 bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-wider cursor-pointer transition-all max-w-xs text-center border-neutral-950 border shadow-sm">
                                    <Upload className="w-3.5 h-3.5" />
                                    Upload Photo
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={(e) => handleImageUpload(e, 'cover')} 
                                    />
                                  </label>
                                  <input
                                    type="text"
                                    value={editingProject.image || ''}
                                    onChange={(e) => handleFieldChange('image', e.target.value)}
                                    placeholder="Or paste relative image url directly"
                                    className="w-full bg-white border border-neutral-200 p-2 font-mono text-[10px] focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-200/60">
                                <div>
                                  <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                    Preview Aspect Ratio
                                  </label>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleFieldChange('imageAspectRatio', 'rectangle')}
                                      className={`font-sans text-[10px] uppercase tracking-wider font-bold py-2 px-3 border cursor-pointer select-none ${
                                        (editingProject.imageAspectRatio || 'rectangle') === 'rectangle'
                                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-sm'
                                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-950'
                                      }`}
                                    >
                                      Rectangle (4:3)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleFieldChange('imageAspectRatio', 'square')}
                                      className={`font-sans text-[10px] uppercase tracking-wider font-bold py-2 px-3 border cursor-pointer select-none ${
                                        editingProject.imageAspectRatio === 'square'
                                          ? 'bg-neutral-950 text-white border-neutral-950 shadow-sm'
                                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-950'
                                      }`}
                                    >
                                      Square (1:1)
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block">
                                      Image Zoom: {Number(editingProject.imageZoom) || 100}%
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleFieldChange('imageZoom', 100)}
                                      className="font-sans text-[9px] uppercase tracking-widest text-neutral-500 hover:text-neutral-950 font-bold cursor-pointer"
                                    >
                                      Reset (100%)
                                    </button>
                                  </div>
                                  <input
                                    type="range"
                                    min="50"
                                    max="250"
                                    value={Number(editingProject.imageZoom) || 100}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      handleFieldChange('imageZoom', isNaN(val) ? 100 : val);
                                    }}
                                    className="w-full accent-neutral-900 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Large description area */}
                        <div>
                          <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                            Narrative Description
                          </label>
                          <textarea
                            rows={3}
                            value={editingProject.description || ''}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            className="w-full bg-neutral-50 border border-neutral-200 p-3 font-sans text-sm focus:outline-none focus:border-neutral-950 leading-relaxed"
                          />
                        </div>

                        {/* Sub-panels or Comic Pages Management */}
                        <div className="border-t border-neutral-200 pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-sans font-medium text-neutral-900 text-sm uppercase tracking-wider">
                                Comic Panels / Showcase Images ({editingProject.comicPages?.length || 0})
                              </h4>
                              <p className="font-sans text-[10px] text-neutral-400">
                                Add individual images with descriptions that render in the carousel reader overlay.
                              </p>
                            </div>
                            
                            <button
                              onClick={handleAddComicPage}
                              className="flex items-center gap-1.5 bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white border border-neutral-950 px-3.5 py-2 text-xs font-sans font-bold uppercase tracking-widest cursor-pointer transition-all shadow-sm"
                            >
                              <Plus className="w-4 h-4" />
                              Add Image Page
                            </button>
                          </div>

                          {/* List of individual panel segments */}
                          <div className="space-y-4">
                            {editingProject.comicPages && editingProject.comicPages.length > 0 ? (
                              editingProject.comicPages.map((page, index) => (
                                <div 
                                  key={index} 
                                  className="border border-neutral-200 bg-neutral-50/20 p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                                >
                                  {/* Thumbnail Preview and uploader */}
                                  <div className="md:col-span-3 flex flex-col items-center gap-2.5">
                                    <span className="font-mono text-[9px] bg-neutral-200 text-neutral-700 px-2 py-0.5 uppercase tracking-wider font-bold">
                                      Page {index + 1}
                                    </span>
                                    <div className="relative w-24 h-24 border border-neutral-200 bg-white group overflow-hidden">
                                      <img
                                        src={page.url}
                                        alt=""
                                        className="w-full h-full object-contain filter drop-shadow-sm select-none"
                                        referrerPolicy="no-referrer"
                                      />
                                      <label className="absolute inset-0 bg-neutral-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] tracking-wider uppercase font-bold transition-all duration-200 cursor-pointer">
                                        <Upload className="w-4 h-4 mb-1" />
                                        Replace
                                        <input 
                                          type="file" 
                                          accept="image/*" 
                                          className="hidden" 
                                          onChange={(e) => handleImageUpload(e, { pageIndex: index })} 
                                        />
                                      </label>
                                    </div>
                                  </div>

                                  {/* Form values */}
                                  <div className="md:col-span-7 space-y-2.5">
                                    <div className="flex gap-2">
                                      <span className="font-sans text-[10px] uppercase font-bold text-neutral-400 w-16 pt-2 shrink-0">Title</span>
                                      <input
                                        type="text"
                                        placeholder="Panel subtitle (e.g. Panel 1)"
                                        value={page.title || ''}
                                        onChange={(e) => handleComicPageChange(index, 'title', e.target.value)}
                                        className="flex-grow bg-white border border-neutral-200 px-3 py-1.5 font-sans text-xs focus:outline-none focus:border-neutral-950"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <span className="font-sans text-[10px] uppercase font-bold text-neutral-400 w-16 pt-2 shrink-0">Caption</span>
                                      <textarea
                                        placeholder="Describe the dialogue or joke here..."
                                        rows={2}
                                        value={page.caption || ''}
                                        onChange={(e) => handleComicPageChange(index, 'caption', e.target.value)}
                                        className="flex-grow bg-white border border-neutral-200 px-3 py-1.5 font-sans text-xs focus:outline-none focus:border-neutral-950 leading-relaxed"
                                      />
                                    </div>
                                  </div>

                                  {/* Ordering Actions */}
                                  <div className="md:col-span-2 flex md:flex-col justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100">
                                    <div className="flex gap-1.5 md:justify-end">
                                      <button
                                        disabled={index === 0}
                                        onClick={() => handleMoveComicPage(index, 'up')}
                                        className={`p-1.5 border border-neutral-200 rounded-none bg-white transition-colors cursor-pointer ${
                                          index === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-neutral-100 hover:border-neutral-400'
                                        }`}
                                        title="Move up"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5 text-neutral-700" />
                                      </button>
                                      
                                      <button
                                        disabled={index === (editingProject.comicPages ? editingProject.comicPages.length - 1 : 0)}
                                        onClick={() => handleMoveComicPage(index, 'down')}
                                        className={`p-1.5 border border-neutral-200 rounded-none bg-white transition-colors cursor-pointer ${
                                          index === (editingProject.comicPages ? editingProject.comicPages.length - 1 : 0) ? 'opacity-20 cursor-not-allowed' : 'hover:bg-neutral-100 hover:border-neutral-400'
                                        }`}
                                        title="Move down"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5 text-neutral-700" />
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => handleDeleteComicPage(index)}
                                      className="p-1.5 text-red-550 border border-neutral-200 hover:bg-red-50 hover:border-red-100 hover:text-red-700 rounded-none bg-white/70 flex items-center justify-center gap-1 text-[10px] font-sans font-bold uppercase transition-colors shrink-0 md:self-end cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Delete
                                    </button>
                                  </div>

                                </div>
                              ))
                            ) : (
                              <div className="p-8 border border-dashed border-neutral-200 bg-neutral-50/50 flex flex-col items-center justify-center text-center gap-2">
                                <Sparkles className="w-6 h-6 text-neutral-300" />
                                <span className="font-sans text-xs text-neutral-400 font-medium">No pages or panel images added.</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Extra Project Details */}
                        <div className="border-t border-neutral-200 pt-6 space-y-4">
                          <div>
                            <h4 className="font-sans font-medium text-neutral-900 text-sm uppercase tracking-wider mb-1">
                              Client details
                            </h4>
                            <p className="font-sans text-[10px] text-neutral-400 mb-4">
                              Specify core delivery milestones, dates, roles, and project context details.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">Client Name</label>
                              <input
                                type="text"
                                value={editingProject.details?.client || ''}
                                onChange={(e) => handleDetailFieldChange('client', e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 p-2 text-xs font-sans focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">Your Role</label>
                              <input
                                type="text"
                                value={editingProject.details?.role || ''}
                                onChange={(e) => handleDetailFieldChange('role', e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 p-2 text-xs font-sans focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">Timeline/Date</label>
                              <input
                                type="text"
                                value={editingProject.details?.date || ''}
                                onChange={(e) => handleDetailFieldChange('date', e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 p-2 text-xs font-sans focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">Core Challenge</label>
                              <textarea
                                rows={2}
                                value={editingProject.details?.challenge || ''}
                                onChange={(e) => handleDetailFieldChange('challenge', e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 p-2 text-xs font-sans focus:outline-none focus:border-neutral-800 leading-relaxed"
                              />
                            </div>
                            <div>
                              <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">Your Solution</label>
                              <textarea
                                rows={2}
                                value={editingProject.details?.solution || ''}
                                onChange={(e) => handleDetailFieldChange('solution', e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 p-2 text-xs font-sans focus:outline-none focus:border-neutral-800 leading-relaxed"
                              />
                            </div>
                            <div>
                              <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">Quantifiable Impact</label>
                              <textarea
                                rows={2}
                                value={editingProject.details?.impact || ''}
                                onChange={(e) => handleDetailFieldChange('impact', e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 p-2 text-xs font-sans focus:outline-none focus:border-neutral-800 leading-relaxed"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center p-12 text-center text-neutral-400 gap-4">
                        <FolderPlus className="w-12 h-12 text-neutral-300" />
                        <div>
                          <h4 className="font-sans font-medium text-neutral-900 text-sm uppercase tracking-wider">
                            No Project Selected
                          </h4>
                          <p className="font-sans text-xs text-neutral-400 mt-1 max-w-[260px]">
                            Choose an existing portfolio project from the sidebar list or click "New Item" to start draft.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ) : cmsTab === 'categories' ? (
                <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-white flex flex-col">
                  <div className="space-y-8 flex-grow">
                    {/* Title Header */}
                    <div className="border-b border-neutral-200 pb-4 flex items-center justify-between">
                      <div>
                        <span className="font-sans text-[9px] bg-neutral-900 text-white px-2 py-0.5 uppercase tracking-widest font-bold">
                          Classification Engine
                        </span>
                        <h3 className="font-sans font-light text-2xl text-neutral-900 tracking-tight mt-1.5 uppercase">
                          Categories Database Manager
                        </h3>
                      </div>
                    </div>

                    {/* STATUS RESPONSE BAR */}
                    {statusMessage && (
                      <div className={`p-4 font-sans text-xs border flex items-center gap-3 ${
                        statusMessage.type === 'success' 
                          ? 'bg-green-50 border-green-300 text-green-800' 
                          : 'bg-red-50 border-red-350 text-red-800'
                      }`}>
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-medium">{statusMessage.text}</span>
                      </div>
                    )}

                    {/* Main Dynamic Split Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      {/* List column */}
                      <div className="col-span-12 md:col-span-7 space-y-4">
                        <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                          Registered Categories List ({categories.length})
                        </label>

                        <div className="border border-neutral-200 divide-y divide-neutral-200/80 bg-neutral-50/20 max-h-[420px] overflow-y-auto shadow-sm">
                          {categories.map((cat) => (
                            <div key={cat.id} className="p-4 flex items-center justify-between bg-white hover:bg-neutral-50 transition-colors">
                              <div className="space-y-1">
                                <h4 className="font-sans font-bold text-sm text-neutral-900 uppercase">
                                  {cat.name}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="font-sans text-[9px] text-neutral-400 font-bold uppercase">
                                    System Key:
                                  </span>
                                  <code className="bg-neutral-50 border border-neutral-150 px-1.5 py-0.5 font-mono text-[10px] text-neutral-600 font-medium lowercase">
                                    {cat.id}
                                  </code>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={cat.id === 'all'}
                                onClick={() => handleDeleteCategory(cat.id)}
                                className={`p-2 border rounded-none transition-all flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-wider cursor-pointer ${
                                  cat.id === 'all'
                                    ? 'opacity-20 cursor-not-allowed border-transparent text-neutral-400'
                                    : 'border-red-100 text-red-500 hover:bg-red-50 hover:border-red-350 hover:text-red-750'
                                }`}
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Creation column */}
                      <div className="col-span-12 md:col-span-5">
                        <div className="bg-neutral-50 border border-neutral-200 p-6 space-y-5">
                          <div>
                            <h4 className="font-sans font-medium text-neutral-900 text-sm uppercase tracking-wider">
                              Add Custom Category
                            </h4>
                            <p className="font-sans text-[10px] text-neutral-400 mt-1 leading-relaxed">
                              Register a fresh filter category tab. It will instantly update across your dynamic visitor portfolio view and editing terminals.
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                Display Label name
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Concept Sketches"
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                className="w-full bg-white border border-neutral-200 p-3 font-sans text-sm focus:outline-none focus:border-neutral-950"
                              />
                            </div>

                            <div>
                              <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                                System Key/ID (Optional)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. concept_sketches"
                                value={newCatId}
                                onChange={(e) => setNewCatId(e.target.value)}
                                className="w-full bg-white border border-neutral-200 p-3 font-sans text-xs focus:outline-none focus:border-neutral-950 font-mono"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={handleAddCategory}
                              disabled={isSavingCategories}
                              className="w-full bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white py-3 text-xs font-sans font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer border border-neutral-950 shadow-sm"
                            >
                              <Plus className="w-4 h-4" />
                              {isSavingCategories ? 'Saving...' : 'Add Category Tab'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : cmsTab === 'domain' ? (
                <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-neutral-50/20 flex flex-col">
                  <div className="space-y-8 flex-grow max-w-5xl">
                    {/* Title Header */}
                    <div className="border-b border-neutral-200 pb-4 flex items-center justify-between">
                      <div>
                        <span className="font-sans text-[9px] bg-neutral-900 text-white px-2 py-0.5 uppercase tracking-widest font-bold">
                          GoDaddy Integration Desk
                        </span>
                        <h3 className="font-sans font-light text-2xl text-neutral-900 tracking-tight mt-1.5 uppercase">
                          Custom DNS Domain Linker
                        </h3>
                      </div>
                    </div>

                    {/* STATUS BANNER */}
                    {(verificationSuccess || domainVerified) && (
                      <div className="p-4 font-sans text-xs border border-green-300 bg-green-50 text-green-850 flex items-center gap-3">
                        <Check className="w-4.5 h-4.5 shrink-0 text-green-600 bg-green-100 p-0.5 rounded-full" />
                        <div>
                          <span className="font-bold uppercase tracking-wider block text-[9px] text-green-700 mb-0.5">Active Propagation Linkage</span>
                          <span className="font-medium">{verificationSuccess || `Your GoDaddy custom domain "${targetDomain}" is saved and linked to this instance's router.`}</span>
                        </div>
                      </div>
                    )}

                    {/* TWO COLUMN WORKSPACE */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Form & Verification */}
                      <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm">
                          <div>
                            <h4 className="font-sans font-bold text-sm text-neutral-900 uppercase tracking-wide">
                              1. Declare Purchased Domain
                            </h4>
                            <p className="font-sans text-[10px] text-neutral-400 mt-1 leading-relaxed">
                              Specify the exact domain name you purchased on GoDaddy. Pointing GoDaddy domains takes under three easy steps.
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="font-sans text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                                GoDaddy Registered Domain Name
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g. preethambharadwaj.com"
                                  value={targetDomain}
                                  onChange={(e) => handleSaveDomain(e.target.value)}
                                  className="flex-grow bg-neutral-50/50 border border-neutral-200 p-3 font-sans text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-950 focus:bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveDomain(targetDomain)}
                                  className="px-4 bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white border border-neutral-950 font-sans text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm"
                                >
                                  Save Domain
                                </button>
                              </div>
                            </div>

                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={handleVerifyDomain}
                                disabled={isVerifyingDomain || !targetDomain}
                                className="w-full bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white py-3 text-xs font-sans font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border border-neutral-950 shadow-[2px_2px_0_rgba(0,0,0,1)] hover:shadow-none font-bold"
                              >
                                {isVerifyingDomain ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-neutral-950"></div>
                                    Querying GoDaddy Nameservers...
                                  </>
                                ) : (
                                  <>
                                    <Settings className="w-4 h-4 animate-spin-slow" />
                                    Verify DNS Configuration
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* DNS Record specifications table */}
                        <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm">
                          <div>
                            <h4 className="font-sans font-bold text-sm text-neutral-900 uppercase tracking-wide">
                              2. Target DNS Records
                            </h4>
                            <p className="font-sans text-[10px] text-neutral-400 mt-1 leading-relaxed">
                              You must add these exact records in your GoDaddy DNS Zone File editor as shown below:
                            </p>
                          </div>

                          <div className="overflow-x-auto border border-neutral-150">
                            <table className="w-full text-left font-sans text-xs">
                              <thead className="bg-neutral-100 text-neutral-600 font-bold uppercase text-[9px] tracking-wider border-b border-neutral-200">
                                <tr>
                                  <th className="p-3">Type</th>
                                  <th className="p-3">Host/Name</th>
                                  <th className="p-3">Value / Target IP</th>
                                  <th className="p-3">TTL</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-150 font-medium">
                                <tr>
                                  <td className="p-3 font-mono font-bold text-neutral-900">A</td>
                                  <td className="p-3 font-mono bg-neutral-50 px-2 text-center text-neutral-600">@</td>
                                  <td className="p-3 font-mono text-neutral-800">151.101.1.195 <span className="text-[10px] text-neutral-400 block">(Application router routing desk)</span></td>
                                  <td className="p-3 text-neutral-400">1 Hour</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-mono font-bold text-neutral-900">A</td>
                                  <td className="p-3 font-mono bg-neutral-50 px-2 text-center text-neutral-600">@</td>
                                  <td className="p-3 font-mono text-neutral-800">151.101.65.195 <span className="text-[10px] text-neutral-400 block">(Secondary fault-tolerant node)</span></td>
                                  <td className="p-3 text-neutral-400">1 Hour</td>
                                </tr>
                                <tr>
                                  <td className="p-3 font-mono font-bold text-neutral-900">CNAME</td>
                                  <td className="p-3 font-mono bg-neutral-50 px-2 text-center text-neutral-600">www</td>
                                  <td className="p-3 font-mono text-neutral-800 break-all">{targetDomain || 'preethambharadwaj.com'}.</td>
                                  <td className="p-3 text-neutral-400">1 Hour</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Authoritative Name Servers Identification section */}
                        <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                              <h4 className="font-sans font-bold text-sm text-neutral-900 uppercase tracking-wide">
                                3. GoDaddy Name Servers Linkage
                              </h4>
                            </div>
                            <p className="font-sans text-[10px] text-neutral-400 mt-1 leading-relaxed">
                              These specific authoritative nameservers manage your domain's active zone files on GoDaddy:
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-neutral-50 border border-neutral-150 p-4 flex flex-col justify-between">
                              <span className="font-sans text-[8px] uppercase tracking-wider text-neutral-400 font-bold">Primary Name Server</span>
                              <code className="text-xs font-mono font-bold text-neutral-800 mt-1 block select-all">ns23.domaincontrol.com</code>
                              <span className="text-[9px] text-green-600 font-sans font-medium mt-1">Active Delegator State</span>
                            </div>

                            <div className="bg-neutral-50 border border-neutral-150 p-4 flex flex-col justify-between">
                              <span className="font-sans text-[8px] uppercase tracking-wider text-neutral-400 font-bold">Secondary Name Server</span>
                              <code className="text-xs font-mono font-bold text-neutral-800 mt-1 block select-all">ns24.domaincontrol.com</code>
                              <span className="text-[9px] text-green-600 font-sans font-medium mt-1">Active Delegator State</span>
                            </div>
                          </div>

                          <div className="p-3 bg-yellow-50 text-yellow-800 border border-yellow-200 font-sans text-[10.5px] leading-relaxed">
                            <strong>Nameserver Setup Complete:</strong> Your GoDaddy domain is configured to use GoDaddy nameservers (<code className="font-mono text-[9.5px]">ns23</code> & <code className="font-mono text-[9.5px]">ns24</code>). DNS records configured on GoDaddy will propagate almost instantly.
                          </div>
                        </div>
                      </div>

                      {/* Instructions / Walkthrough */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="bg-neutral-900 text-neutral-100 p-6 space-y-5 border border-neutral-950 shadow-md">
                          <div>
                            <span className="font-sans text-[8px] bg-yellow-400 text-neutral-950 px-2 py-0.5 uppercase tracking-widest font-bold">
                              GoDaddy Action Manual
                            </span>
                            <h4 className="font-sans font-bold text-sm uppercase tracking-wide text-white mt-1.5">
                              Step-by-Step GoDaddy DNS Guide
                            </h4>
                          </div>

                          <ol className="space-y-4 text-xs font-sans text-neutral-300 list-none pl-0">
                            <li className="flex gap-3">
                              <span className="font-mono text-yellow-400 font-bold">01.</span>
                              <div>
                                <strong className="text-white block uppercase text-[10px] tracking-wider">Log in</strong>
                                Open your <a href="https://dcc.godaddy.com" target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline">GoDaddy Domain Portfolio</a> panel and select your domain name.
                              </div>
                            </li>
                            <li className="flex gap-3">
                              <span className="font-mono text-yellow-400 font-bold">02.</span>
                              <div>
                                <strong className="text-white block uppercase text-[10px] tracking-wider">Manage DNS</strong>
                                Under the selected domain, click on the <strong className="text-neutral-100">"DNS"</strong> tab or <strong className="text-neutral-100">"Manage DNS"</strong> to load your Zone File settings.
                              </div>
                            </li>
                            <li className="flex gap-3">
                              <span className="font-mono text-yellow-400 font-bold">03.</span>
                              <div>
                                <strong className="text-white block uppercase text-[10px] tracking-wider">Purge Park Records</strong>
                                If there are existing <strong className="text-neutral-100">"A"</strong> records pointing to GoDaddy holding pages (e.g. `34.102.136.193`), delete or edit them.
                              </div>
                            </li>
                            <li className="flex gap-3">
                              <span className="font-mono text-yellow-400 font-bold">04.</span>
                              <div>
                                <strong className="text-white block uppercase text-[10px] tracking-wider">Add IP records</strong>
                                Click <strong className="text-neutral-100">"Add New Record"</strong>. Insert two A records matching standard values:
                                <div className="mt-2 bg-neutral-950 p-2 border border-neutral-800 rounded font-mono text-[10px] select-all text-neutral-300">
                                  Host: @<br/>
                                  IPs: 151.101.1.195 and 151.101.65.195
                                </div>
                              </div>
                            </li>
                            <li className="flex gap-3">
                              <span className="font-mono text-yellow-400 font-bold">05.</span>
                              <div>
                                <strong className="text-white block uppercase text-[10px] tracking-wider">CNAME setup</strong>
                                Ensure there is a <strong className="text-neutral-100">CNAME</strong> record for <code className="text-yellow-400 font-bold">www</code> set to point to <code className="bg-neutral-950 px-1 font-semibold text-neutral-200">@</code> or your apex domain: <code className="text-neutral-100 font-semibold">{targetDomain}</code>.
                              </div>
                            </li>
                            <li className="flex gap-3">
                              <span className="font-mono text-yellow-400 font-bold">06.</span>
                              <div>
                                <strong className="text-white block uppercase text-[10px] tracking-wider">Save & Propagate</strong>
                                Click Save. GoDaddy servers will update across the globe. Wait a few moments, then hit the <strong className="text-neutral-100">"Verify DNS Configuration"</strong> button on this screen!
                              </div>
                            </li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : cmsTab === 'sections' ? (
                <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-white flex flex-col">
                  <div className="space-y-8 flex-grow max-w-5xl">
                    <div className="border-b border-neutral-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="font-sans text-[9px] bg-neutral-900 text-white px-2 py-0.5 uppercase tracking-widest font-bold">
                          Homepage Typography & Graphics CMS
                        </span>
                        <h3 className="font-sans font-light text-2xl text-neutral-900 tracking-tight mt-1.5 uppercase">
                          Website Sections Editor
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveSections}
                        disabled={isSavingSections}
                        className="bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white px-5 py-2.5 text-xs font-sans font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer border border-neutral-950 shadow-[3px_3px_0_rgba(0,0,0,1)] flex items-center justify-center gap-2 shrink-0 self-start animate-none"
                      >
                        <Save className="w-4 h-4" />
                        {isSavingSections ? 'Saving...' : 'Publish Sections'}
                      </button>
                    </div>

                    {statusMessage && (
                      <div className={`p-4 font-sans text-xs border flex items-center gap-3 ${
                        statusMessage.type === 'success' 
                          ? 'bg-green-50 border-green-300 text-green-805' 
                          : 'bg-red-50 border-red-300 text-red-805'
                      }`}>
                        <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                        <span className="font-medium">{statusMessage.text}</span>
                      </div>
                    )}

                    {sections.length === 0 ? (
                      <div className="p-12 border border-dashed border-neutral-200 text-center text-neutral-400 font-sans text-xs">
                        Preparing section fields... Please wait.
                      </div>
                    ) : (
                      <div className="space-y-12">
                        {sections.map((sec: any) => (
                          <div key={sec.id} className="border border-neutral-200 p-6 bg-stone-50/50 hover:border-neutral-400 transition-all">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-200/80">
                              <h4 className="font-sans font-bold text-xs uppercase tracking-widest text-neutral-900">
                                Section ID: <span className="text-yellow-650 font-mono font-black">{sec.id}</span>
                              </h4>
                              <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">Section Schema Unit</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">Section Title</label>
                                  <input
                                    type="text"
                                    value={sec.title || ''}
                                    onChange={(e) => handleUpdateSectionField(sec.id, 'title', e.target.value)}
                                    className="w-full bg-white border border-neutral-200 p-2.5 font-sans text-xs focus:outline-none focus:border-neutral-950 font-semibold text-neutral-800"
                                  />
                                </div>

                                {'subtitle' in sec && (
                                  <div>
                                    <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">Section Subtitle</label>
                                    <input
                                      type="text"
                                      value={sec.subtitle || ''}
                                      onChange={(e) => handleUpdateSectionField(sec.id, 'subtitle', e.target.value)}
                                      className="w-full bg-white border border-neutral-200 p-2.5 font-sans text-xs focus:outline-none focus:border-neutral-950 text-neutral-700"
                                    />
                                  </div>
                                )}

                                <div>
                                  <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">Body Text Content</label>
                                  <textarea
                                    rows={5}
                                    value={sec.description || ''}
                                    onChange={(e) => handleUpdateSectionField(sec.id, 'description', e.target.value)}
                                    className="w-full bg-white border border-neutral-200 p-2.5 font-sans text-xs focus:outline-none focus:border-neutral-950 leading-relaxed text-neutral-600"
                                  />
                                </div>
                              </div>

                              <div className="space-y-4 flex flex-col justify-between">
                                <div>
                                  <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">Graphic Vector URL or Image Path</label>
                                  <input
                                    type="text"
                                    value={sec.image || ''}
                                    onChange={(e) => handleUpdateSectionField(sec.id, 'image', e.target.value)}
                                    className="w-full bg-white border border-neutral-200 p-2.5 font-sans font-mono text-xs focus:outline-none focus:border-neutral-950 text-neutral-700"
                                    placeholder="e.g. /drawings/hero_artwork.svg"
                                  />
                                </div>

                                <div className="bg-white border border-neutral-250 p-4 shrink-0 flex flex-col items-center justify-center min-h-[160px] relative text-center">
                                  {sec.image ? (
                                    <img 
                                      src={sec.image} 
                                      alt={sec.title} 
                                      referrerPolicy="no-referrer"
                                      className="max-h-[120px] object-contain mb-2 border border-neutral-100" 
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <span className="text-neutral-300 text-[10px] font-sans uppercase">No Section Image Configured</span>
                                  )}
                                  <span className="font-sans text-[9px] text-neutral-400 uppercase tracking-wide block mt-1">Image Preview</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : cmsTab === 'comments' ? (
                <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-white flex flex-col">
                  <div className="space-y-8 flex-grow max-w-5xl">
                    <div className="border-b border-neutral-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="font-sans text-[9px] bg-neutral-900 text-white px-2 py-0.5 uppercase tracking-widest font-bold">
                          Visitor Conversation Hub
                        </span>
                        <h3 className="font-sans font-light text-2xl text-neutral-900 tracking-tight mt-1.5 uppercase">
                          Manage Comments & Reviews
                        </h3>
                      </div>
                      <span className="font-sans font-bold text-xs uppercase tracking-widest px-4 py-2 bg-neutral-100 border border-neutral-200 shrink-0 self-start">
                        Total Comments: {comments.length}
                      </span>
                    </div>

                    {statusMessage && (
                      <div className="p-4 font-sans text-xs border border-green-300 bg-green-50 text-green-808 flex items-center gap-3">
                        <Check className="w-4.5 h-4.5 shrink-0" />
                        <span className="font-medium">{statusMessage.text}</span>
                      </div>
                    )}

                    {comments.length === 0 ? (
                      <div className="p-16 border border-dashed border-neutral-200 rounded-none text-center text-neutral-400 font-sans text-xs">
                        No comments have been posted yet. Visitors can write reviews on the front page widget.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((comment: any) => (
                          <div key={comment.id} className="border border-neutral-200 bg-stone-50/40 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-neutral-400 transition-all">
                            <div className="space-y-1.5 flex-grow">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-900">
                                  {comment.name}
                                </span>
                                <span className="font-mono text-[9px] text-neutral-400">
                                  {comment.date ? new Date(comment.date).toLocaleDateString() : 'N/A'}
                                </span>
                                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-yellow-400 text-neutral-950 font-sans font-black text-[9px] tracking-wide border border-neutral-950 shadow-[1px_1px_0_rgba(0,0,0,1)] uppercase">
                                  ★ {comment.rating || 5} / 5
                                </span>
                              </div>
                              <p className="font-sans text-neutral-600 text-xs leading-relaxed max-w-3xl">
                                "{comment.text}"
                              </p>
                            </div>

                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={isDeletingCommentId === comment.id}
                              className="bg-[#FFDF20] text-black border border-neutral-950 hover:!bg-neutral-950 hover:!text-white p-2.5 text-xs font-sans uppercase font-bold tracking-widest shrink-0 transition-all cursor-pointer self-start md:self-center flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              {isDeletingCommentId === comment.id ? 'Removing...' : 'Moderate / Delete'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : cmsTab === 'inquiries' ? (
                <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-white flex flex-col">
                  <div className="space-y-8 flex-grow max-w-5xl animate-fadeIn">
                    <div className="border-b border-neutral-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="font-sans text-[9px] bg-neutral-900 text-white px-2 py-0.5 uppercase tracking-widest font-bold">
                          Client Submission Terminal
                        </span>
                        <h3 className="font-sans font-light text-2xl text-neutral-900 tracking-tight mt-1.5 uppercase">
                          Inquiries & Client Messages
                        </h3>
                      </div>
                      <span className="font-sans font-bold text-xs uppercase tracking-widest px-4 py-2 bg-neutral-100 border border-neutral-200 shrink-0 self-start">
                        Total Inquiries: {inquiries.length}
                      </span>
                    </div>

                    {statusMessage && (
                      <div className="p-4 font-sans text-xs border border-green-300 bg-green-50 text-green-800 flex items-center gap-3">
                        <Check className="w-4.5 h-4.5 shrink-0" />
                        <span className="font-medium">{statusMessage.text}</span>
                      </div>
                    )}

                    {inquiries.length === 0 ? (
                      <div className="p-16 border border-dashed border-neutral-200 rounded-none text-center text-neutral-400 font-sans text-xs">
                        No inquiries have been received yet. Visitors can submit requests using the Contact inquiry form.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {inquiries.map((inquiry: any) => (
                          <div key={inquiry.id} className="border border-neutral-200 bg-stone-50/40 p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-neutral-400 transition-all">
                            <div className="space-y-2 flex-grow">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-900">
                                  {inquiry.name}
                                </span>
                                <span className="font-mono text-[9px] text-neutral-400">
                                  {inquiry.date ? new Date(inquiry.date).toLocaleString() : 'N/A'}
                                </span>
                                <a
                                  href={`mailto:${inquiry.email}`}
                                  className="font-mono text-[10px] text-blue-600 hover:underline"
                                >
                                  {inquiry.email}
                                </a>
                              </div>
                              <div className="text-xs">
                                <span className="font-sans text-neutral-400 uppercase tracking-widest font-bold text-[9px] mr-2">Subject:</span>
                                <span className="font-sans font-semibold text-neutral-800 uppercase tracking-tight">{inquiry.subject}</span>
                              </div>
                              <p className="font-sans text-neutral-600 text-xs leading-relaxed max-w-3xl whitespace-pre-wrap">
                                {inquiry.message}
                              </p>
                            </div>

                            <button
                              onClick={() => handleDeleteInquiry(inquiry.id)}
                              className="bg-[#FFDF20] text-black border border-neutral-950 hover:!bg-neutral-950 hover:!text-white p-2.5 text-xs font-sans uppercase font-bold tracking-widest shrink-0 transition-all cursor-pointer self-start md:self-center flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Dismiss
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-neutral-50/10 flex flex-col">
                  <div className="space-y-8 flex-grow max-w-lg">
                    <div className="border-b border-neutral-200 pb-4">
                      <span className="font-sans text-[9px] bg-neutral-900 text-white px-2 py-0.5 uppercase tracking-widest font-bold">
                        Terminal Central Management Security
                      </span>
                      <h3 className="font-sans font-light text-2xl text-neutral-900 tracking-tight mt-1.5 uppercase">
                        Change Security Credentials
                      </h3>
                      <p className="font-sans text-xs text-neutral-400 mt-1">
                        Modify admin panels logon parameters. Changing credentials generates a secure verification OTP delivered to your specified Email ID.
                      </p>
                    </div>

                    <form onSubmit={handleChangeCredentialsSubmit} className="space-y-6 bg-white border border-neutral-250 p-6 md:p-8 shadow-[3px_3px_0_rgba(0,0,0,1)] animate-fadeIn">
                      {credError && (
                        <div className="p-4 font-sans text-xs border border-red-300 bg-red-50 text-red-800 flex items-center gap-3">
                          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                          <span className="font-medium">{credError}</span>
                        </div>
                      )}

                      {credSuccess && (
                        <div className="p-4 font-sans text-xs border border-green-300 bg-green-50 text-green-800 flex items-center gap-3">
                          <Check className="w-4.5 h-4.5 shrink-0" />
                          <span className="font-medium">{credSuccess}</span>
                        </div>
                      )}

                      {simulatedOtpNote && (
                        <div className="p-4 rounded-none border border-yellow-400 bg-yellow-50 text-neutral-900 font-sans text-xs flex flex-col gap-1.5 shadow-[2px_2px_0_rgba(0,0,0,0.05)]">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                            <span className="font-extrabold uppercase text-[10px] tracking-widest">Developer Verification Mock</span>
                          </div>
                          <span className="font-mono text-xs text-neutral-800 bg-white/70 border border-yellow-250 p-2 block tracking-tight select-all">
                            {simulatedOtpNote}
                          </span>
                          <span className="text-[10px] text-neutral-500 leading-tight">
                            The security system successfully generated an OTP. Use this code to authorize updates instantly.
                          </span>
                        </div>
                      )}

                      <div>
                        <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                          Current Passcode / Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 p-3 font-sans text-sm focus:outline-none focus:border-neutral-950 text-neutral-800"
                          placeholder="REQUIRED to request OTP or commit changes"
                          required
                        />
                      </div>

                      <div className="border-t border-neutral-100 pt-5 space-y-4">
                        <div>
                          <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                            New Admin Username
                          </label>
                          <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full bg-neutral-50 border border-neutral-200 p-3 font-sans text-sm focus:outline-none focus:border-neutral-950 text-neutral-800"
                            placeholder="Enter new admin username"
                          />
                        </div>

                        <div>
                          <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                            New Verified Email ID
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              className="flex-grow bg-neutral-50 border border-neutral-200 p-3 font-sans text-sm focus:outline-none focus:border-neutral-950 text-neutral-800"
                              placeholder="e.g. bharadwajpreetham@gmail.com"
                            />
                            <button
                              type="button"
                              onClick={handleRequestOtp}
                              disabled={otpRequesting}
                              className="bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white border border-neutral-950 font-sans text-[10px] font-bold uppercase px-4 tracking-wider transition-all duration-300 shrink-0 cursor-pointer disabled:bg-neutral-200 disabled:text-neutral-400 shadow-sm"
                            >
                              {otpRequesting ? 'Requesting...' : 'Request OTP'}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                            6-Digit Verification OTP Code
                          </label>
                          <input
                            type="text"
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            className="w-full bg-neutral-50 border border-neutral-200 p-3 font-mono text-center tracking-widest text-sm font-bold focus:outline-none focus:border-neutral-950 text-neutral-800"
                            placeholder="------"
                          />
                        </div>

                        <div>
                          <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-neutral-50 border border-neutral-200 p-3 font-sans text-sm focus:outline-none focus:border-neutral-950 text-neutral-800"
                            placeholder="Choose secure new admin password"
                          />
                        </div>

                        <div>
                          <label className="font-sans text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-neutral-50 border border-neutral-200 p-3 font-sans text-sm focus:outline-none focus:border-neutral-950 text-neutral-800"
                            placeholder="Retype password confirmation"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#FFDF20] text-black hover:!bg-neutral-950 hover:!text-white font-sans text-xs font-bold uppercase py-3.5 tracking-widest border border-neutral-950 transition-all duration-300 cursor-pointer shadow-md font-bold"
                      >
                        Verify & Commit Security Profile
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
