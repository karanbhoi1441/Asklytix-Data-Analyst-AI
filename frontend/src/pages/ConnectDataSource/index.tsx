import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, MessageSquare, LogOut,
  CloudUpload, FolderOpen,
  ChevronDown, CheckCircle2, AlertCircle, Loader2,
  Lock, Layers, Upload, Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDatasets } from '@/hooks/useDatasets';
import { datasetService } from '@/services/datasetService';
import { DataSourceMotionBackground } from '@/components/connect/DataSourceMotionBackground';
import logo3dImg from '@/assets/asklytix_3d_logo.png';

// ─── Types & Constants ────────────────────────────────────────────────────────
const ACCEPTED_TYPES = ['.csv', '.xlsx', '.xls', '.json', '.parquet'];
const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

// ─── Main Page Component ────────────────────────────────────────────────────────
export const ConnectDataSourcePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { setActiveDataset, activeDataset, deleteDataset, clearAllDatasets } = useDatasets();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync existing active dataset state
  const [uploadedInfo, setUploadedInfo] = useState<{
    name: string;
    format: string;
    size: string;
    rows: number;
    cols: number;
  } | null>(() => {
    if (activeDataset) {
      return {
        name: `${activeDataset.name}.${activeDataset.format}`,
        format: activeDataset.format.toUpperCase(),
        size: activeDataset.sizeLabel,
        rows: activeDataset.rows,
        cols: activeDataset.columns
      };
    }
    return null;
  });

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>(() => {
    return activeDataset ? 'success' : 'idle';
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('Uploading dataset...');
  const [errorMsg, setErrorMsg] = useState('');
  const [lockedNotice, setLockedNotice] = useState(false);

  useEffect(() => {
    if (activeDataset) {
      setUploadedInfo({
        name: `${activeDataset.name}.${activeDataset.format}`,
        format: activeDataset.format.toUpperCase(),
        size: activeDataset.sizeLabel,
        rows: activeDataset.rows,
        cols: activeDataset.columns
      });
      setUploadStatus('success');
    } else {
      setUploadedInfo(null);
      setUploadStatus('idle');
    }
  }, [activeDataset]);

  const handleRemoveDataset = async () => {
    try {
      if (activeDataset?.id) {
        await deleteDataset(activeDataset.id);
      } else {
        await clearAllDatasets();
      }
    } catch {
      // ignore
    } finally {
      setUploadedInfo(null);
      setUploadStatus('idle');
    }
  };

  const isDatasetConnected = (uploadStatus === 'success' || !!activeDataset) && !!uploadedInfo;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SB';

  const handleLogout = async () => {
    await logout();
  };

  const handleLockedClick = () => {
    setLockedNotice(true);
    setTimeout(() => setLockedNotice(false), 2500);
  };

  const simulateProcessing = useCallback(async (file: File) => {
    setUploadStatus('uploading');
    setUploadProgress(20);
    setProgressStage('Uploading and validating dataset with backend...');

    const cleanName = file.name.replace(/\.[^.]+$/, '');
    const sizeStr = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    try {
      setTimeout(() => {
        setUploadProgress(70);
        setProgressStage('Parsing binary & schema via analytics engine...');
      }, 350);

      const res = await datasetService.upload(file, cleanName);
      const data = res.data;

      setTimeout(() => {
        setUploadProgress(100);
        setProgressStage('Dataset Ready!');

        setActiveDataset(data.dataset_id);
        setUploadedInfo({
          name: `${data.name}.${data.format}`,
          format: data.format.toUpperCase(),
          size: data.sizeLabel || sizeStr,
          rows: data.row_count,
          cols: data.column_count
        });
        setUploadStatus('success');

        // Automatically navigate to Analysis Chat / AI Assistant page after confirmation
        setTimeout(() => {
          navigate('/ask');
        }, 1200);
      }, 600);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload and process file.');
      setUploadStatus('error');
    }
  }, [setActiveDataset, navigate]);

  const validateAndHandle = useCallback((file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      setErrorMsg(`Unsupported format. Please use: ${ACCEPTED_TYPES.join(', ')}`);
      setUploadStatus('error');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMsg(`File exceeds 5 MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(1)} MB`);
      setUploadStatus('error');
      return;
    }
    setErrorMsg('');
    simulateProcessing(file);
  }, [simulateProcessing]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndHandle(file);
  }, [validateAndHandle]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndHandle(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full relative" style={{ background: '#070d1a' }}>

      {/* ── DESKTOP LEFT SIDEBAR (Hidden on mobile < md) ───────────────── */}
      <aside
        className="hidden md:flex w-[190px] lg:w-[220px] shrink-0 flex-col border-r justify-between backdrop-blur-xl"
        style={{ background: 'rgba(6, 11, 23, 0.75)', borderColor: 'rgba(30, 58, 138, 0.3)' }}
      >
        {/* Top Logo & Branding */}
        <div>
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 px-4 py-3.5 border-b cursor-pointer group select-none transition-colors hover:bg-slate-900/40"
            style={{ borderColor: '#1a2744' }}
          >
            <div className="relative flex items-center justify-center shrink-0">
              <div className="absolute inset-0 bg-cyan-500/25 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
              <img
                src={logo3dImg}
                alt="AskLytix 3D Logo"
                className="w-8 h-8 object-contain relative z-10 drop-shadow-[0_2px_8px_rgba(6,182,212,0.45)] transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex items-baseline">
              <span className="text-white font-bold text-sm tracking-tight">Ask</span>
              <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Lytix</span>
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping opacity-75 inline-block" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-4 space-y-1.5">
            {/* Active: Data Source */}
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl select-none"
              style={{ background: '#0f2d5e', border: '1px solid #1e4a8a' }}
            >
              <Database className="w-4 h-4 shrink-0" style={{ color: '#3b82f6' }} />
              <span className="text-sm font-bold" style={{ color: '#60a5fa' }}>Data Source</span>
            </div>

            {/* Locked/Unlocked: Data Health & Clean */}
            {isDatasetConnected ? (
              <motion.div
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer select-none text-slate-300 hover:bg-slate-900 transition-all border border-transparent hover:border-cyan-500/30"
                whileHover={{ background: '#0d1a2e' }}
                transition={{ duration: 0.15 }}
                onClick={() => navigate('/ask')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-200 truncate">Data Health & Clean</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] shrink-0" />
              </motion.div>
            ) : (
              <div
                onClick={handleLockedClick}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl select-none text-slate-600 cursor-not-allowed opacity-60 hover:opacity-80 transition-all"
                title="Upload a dataset first to unlock Data Health & Clean"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="text-sm font-medium text-slate-600 truncate">Data Health & Clean</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              </div>
            )}

            {/* Locked/Unlocked: Dashboard */}
            {isDatasetConnected ? (
              <motion.div
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer select-none text-slate-300 hover:bg-slate-900 transition-all border border-transparent hover:border-purple-500/30"
                whileHover={{ background: '#0d1a2e' }}
                transition={{ duration: 0.15 }}
                onClick={() => navigate('/dashboard')}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-200 truncate">Analysis Chat</span>
                </div>
              </motion.div>
            ) : (
              <div
                onClick={handleLockedClick}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl select-none text-slate-600 cursor-not-allowed opacity-60 hover:opacity-80 transition-all"
                title="Upload a dataset first to unlock analysis chat"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Layers className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="text-sm font-medium text-slate-600 truncate">Analysis Chat</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              </div>
            )}

            {/* Locked Notice Message */}
            <AnimatePresence>
              {lockedNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] text-center font-semibold"
                >
                  🔒 Upload a dataset first to unlock analysis & chat!
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </div>

        {/* User Card */}
        <div
          className="mx-3 mb-4 px-3 py-3 rounded-xl flex items-center gap-2.5 cursor-pointer border shrink-0"
          style={{ background: '#0a1628', borderColor: '#1a2744' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#4f46e5)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate leading-tight">{user?.name ?? 'Karan Bhoi'}</p>
            <p className="text-[10px] text-slate-500 truncate leading-tight font-mono">{user?.email ?? 'karan@example.com'}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        </div>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 w-full">

        {/* ── TOP HEADER (Transparent for all screen sizes) ─────────────── */}
        <header
          className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b shrink-0 z-20 backdrop-blur-sm"
          style={{ borderColor: 'rgba(30, 58, 138, 0.25)', background: 'transparent' }}
        >
          {/* Mobile Brand Logo & Header */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              onClick={() => navigate('/')}
              className="flex md:hidden items-center gap-2 cursor-pointer select-none shrink-0"
            >
              <img
                src={logo3dImg}
                alt="AskLytix Logo"
                className="w-7 h-7 object-contain drop-shadow-[0_2px_8px_rgba(6,182,212,0.45)]"
              />
              <span className="text-white font-bold text-sm tracking-tight hidden xs:inline">Ask<span className="text-cyan-400">Lytix</span></span>
            </div>

            <div className="hidden md:block">
              <h1 className="text-base font-extrabold text-white tracking-wide">Connect Data Source</h1>
            </div>

            {/* Mobile Navigation Pill Tabs (< md) */}
            <div className="flex md:hidden items-center gap-1.5 ml-1">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0f2d5e] text-[#60a5fa] border border-[#1e4a8a]">
                Source
              </span>
              {isDatasetConnected && (
                <>
                  <button
                    onClick={() => navigate('/ask')}
                    className="px-2 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800"
                  >
                    Clean
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-2 py-1 rounded-lg text-xs font-medium text-purple-300 hover:text-white bg-slate-900/80 border border-slate-800"
                  >
                    Chat
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Header: Logout & Quick Action */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              onClick={handleLogout}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 border transition-all cursor-pointer"
              style={{ background: 'transparent', borderColor: '#1e3a6a' }}
              whileHover={{ borderColor: '#3b82f6', background: '#0f2040', boxShadow: '0 0 12px rgba(59,130,246,0.15)', color: '#fff' }}
              transition={{ duration: 0.15 }}
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Logout</span>
            </motion.button>
          </div>
        </header>

        {/* ── PAGE CONTENT ────────────────────────────────────────────── */}
        <main className="relative flex-1 flex flex-col items-center justify-center px-3 sm:px-6 lg:px-8 py-6 sm:py-10 overflow-y-auto">
          {/* Live Data Pipeline & Ingestion Motion Background */}
          <DataSourceMotionBackground />

          <div className="relative z-10 w-full max-w-3xl lg:max-w-4xl space-y-5 my-auto">

            {/* Hero Icon */}
            <div className="flex justify-center">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(135deg, #0f2a5e, #1e1b4b)',
                  border: '1px solid #1e4a8a',
                  boxShadow: '0 0 30px rgba(59,130,246,0.25), 0 0 60px rgba(99,102,241,0.1)',
                }}
              >
                <Database className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: '#60a5fa' }} />
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 20px rgba(59,130,246,0.1)' }}
                />
              </div>
            </div>

            {/* Heading */}
            <div className="text-center space-y-2 px-2">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight"
                style={{
                  background: 'linear-gradient(90deg, #3b82f6 0%, #818cf8 50%, #60a5fa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Start Your Analysis
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                Upload a CSV or Excel file to let the AI analyze, visualize,<br className="hidden sm:inline" />
                and extract insights from your data instantly.
              </p>
            </div>

            {/* ── UPLOAD DROPZONE CONTAINER (TRANSPARENT GLASS) ───────────────────── */}
            <motion.div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (uploadStatus !== 'uploading' && uploadStatus !== 'success') inputRef.current?.click();
              }}
              animate={isDragOver ? { scale: 1.01 } : { scale: 1 }}
              className="relative rounded-2xl overflow-hidden select-none backdrop-blur-md transition-all duration-300"
              style={{
                background: isDragOver ? 'rgba(30, 58, 138, 0.22)' : 'rgba(8, 16, 32, 0.28)',
                border: `1.5px dashed ${uploadStatus === 'success' ? '#10b981' : isDragOver ? '#38bdf8' : 'rgba(56, 189, 248, 0.45)'}`,
                boxShadow: uploadStatus === 'success'
                  ? '0 0 30px rgba(16,185,129,0.18), inset 0 0 30px rgba(16,185,129,0.05)'
                  : isDragOver
                    ? '0 0 35px rgba(56,189,248,0.25), inset 0 0 35px rgba(56,189,248,0.05)'
                    : '0 0 30px rgba(6,182,212,0.12), inset 0 0 30px rgba(6,182,212,0.03)',
                minHeight: '220px',
              }}
            >
              {/* Center Content */}
              <div className="relative z-10 flex flex-col items-center justify-center py-10 px-8 text-center">
                <AnimatePresence mode="wait">

                  {/* 1. UPLOADING PROGRESS ANIMATION */}
                  {uploadStatus === 'uploading' && (
                    <motion.div
                      key="uploading"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center gap-3 w-full max-w-md py-4"
                      onClick={e => e.stopPropagation()}
                    >
                      <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-1" />
                      <p className="text-sm font-bold text-white tracking-wide">{progressStage}</p>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-xs font-mono text-cyan-300 font-semibold">{uploadProgress}%</span>
                    </motion.div>
                  )}

                  {/* 2. DATASET CONNECTED & READY STATE — CLEAN FORMAT (JUST UPLOAD & DELETE OPTIONS) */}
                  {uploadStatus === 'success' && uploadedInfo && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center gap-3 py-3"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-0.5">
                        <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-full px-2">
                          <h3 className="text-base sm:text-lg font-black text-white tracking-tight truncate max-w-[240px] sm:max-w-md">
                            {uploadedInfo.name}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold font-mono shrink-0">
                            CONNECTED & READY
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 font-mono px-2 text-break-safe">
                          <span className="text-emerald-400 font-bold">{uploadedInfo.format}</span> • {uploadedInfo.size} • {uploadedInfo.rows.toLocaleString()} rows • {uploadedInfo.cols} columns
                        </p>
                      </div>

                      {/* EXACTLY TWO CLEAN OPTIONS: 1. UPLOAD FILE & 2. DELETE UPLOADED FILE */}
                      <div className="flex flex-wrap items-center justify-center gap-3 mt-3 w-full max-w-md px-2">
                        {/* Option 1: Upload File */}
                        <motion.button
                          whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(59,130,246,0.45)' }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setUploadStatus('idle');
                            setTimeout(() => inputRef.current?.click(), 100);
                          }}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 cursor-pointer shadow-lg shadow-cyan-500/25 transition-all"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload File</span>
                        </motion.button>

                        {/* Option 2: Delete Uploaded File */}
                        <motion.button
                          whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(244,63,94,0.35)' }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleRemoveDataset}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-600/30 border border-rose-500/40 hover:border-rose-500 cursor-pointer shadow-md transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" />
                          <span>Delete Uploaded File</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* 3. ERROR STATE */}
                  {uploadStatus === 'error' && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-2"
                      onClick={e => e.stopPropagation()}
                    >
                      <AlertCircle className="w-10 h-10 text-rose-400 mb-1" />
                      <p className="text-rose-400 font-bold text-sm">Upload Error</p>
                      <p className="text-xs text-slate-400 max-w-xs">{errorMsg}</p>
                      <button
                        className="text-xs text-blue-400 underline mt-1 hover:text-blue-300 cursor-pointer transition-colors"
                        onClick={e => { e.stopPropagation(); setUploadStatus('idle'); }}
                      >
                        Try again
                      </button>
                    </motion.div>
                  )}

                  {/* 4. DEFAULT IDLE DROPZONE — SHOWS "BROWSE FILES" UPLOAD BUTTON */}
                  {uploadStatus === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <div className="mb-1">
                        <CloudUpload
                          className="w-12 h-12"
                          style={{ color: isDragOver ? '#60a5fa' : '#3b82f6' }}
                          strokeWidth={1.5}
                        />
                      </div>
                      <p className="text-base font-semibold text-slate-200">
                        <span style={{ color: '#3b82f6' }} className="font-bold">Click to upload</span>
                        {' '}or drag and drop
                      </p>
                      <p className="text-xs text-slate-500 font-mono">CSV or Excel (MAX. 5MB)</p>

                      {/* Browse Files Upload Button */}
                      <motion.button
                        className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer"
                        style={{
                          background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)',
                          boxShadow: '0 0 18px rgba(59,130,246,0.35)',
                        }}
                        whileHover={{
                          boxShadow: '0 0 28px rgba(59,130,246,0.55)',
                          background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)',
                        }}
                        whileTap={{ scale: 0.97 }}
                        onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                        transition={{ duration: 0.15 }}
                      >
                        <FolderOpen className="w-4 h-4" />
                        Browse Files
                      </motion.button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                className="hidden"
                onChange={handleInput}
              />
            </motion.div>

            {/* ── PAGE ENDS HERE ─── */}
          </div>
        </main>
      </div>
    </div>
  );
};
