import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Trash2, Edit3, Save, X, ChevronUp, ChevronDown,
  RotateCcw, CheckCircle2, AlertCircle, Copy, FileText, Upload, Download
} from 'lucide-react';
import { DEFAULT_QUESTIONS, loadQuestionBank, saveQuestionBank, resetQuestionBank, isQuestionBankCustomized } from '../data/questions';

const EMPTY_QUESTION = {
  question: '',
  options: ['', '', '', ''],
  answer: 0,
};

export default function QuestionBankManager({ onClose, onSaved }) {
  const [questions, setQuestions] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null); // index of question being edited, null = none
  const [editForm, setEditForm] = useState({ ...EMPTY_QUESTION });
  const [isAdding, setIsAdding] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState(null);
  const [isCustomized, setIsCustomized] = useState(false);

  // Load on mount
  useEffect(() => {
    setQuestions(loadQuestionBank());
    setIsCustomized(isQuestionBankCustomized());
  }, []);

  // Show a toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Save question bank to localStorage
  const handleSaveBank = () => {
    // Validate all questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        showToast(`Question ${i + 1} has an empty question text.`, 'error');
        return;
      }
      const emptyOpts = q.options.filter(o => !o.trim());
      if (emptyOpts.length > 0) {
        showToast(`Question ${i + 1} has empty option(s).`, 'error');
        return;
      }
    }

    if (questions.length === 0) {
      showToast('Cannot save an empty question bank.', 'error');
      return;
    }

    // Re-index IDs sequentially
    const indexed = questions.map((q, idx) => ({ ...q, id: idx + 1 }));
    saveQuestionBank(indexed);
    setQuestions(indexed);
    setHasChanges(false);
    setIsCustomized(true);
    showToast(`Saved ${indexed.length} questions to active exam bank.`);
    if (onSaved) onSaved(indexed);
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    resetQuestionBank();
    setQuestions([...DEFAULT_QUESTIONS]);
    setHasChanges(false);
    setIsCustomized(false);
    setEditingIdx(null);
    setIsAdding(false);
    showToast('Question bank reset to factory defaults.');
    if (onSaved) onSaved(DEFAULT_QUESTIONS);
  };

  // Start editing a question
  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditForm({
      question: questions[idx].question,
      options: [...questions[idx].options],
      answer: questions[idx].answer,
    });
    setIsAdding(false);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingIdx(null);
    setEditForm({ ...EMPTY_QUESTION });
  };

  // Save an individual edit
  const saveEdit = () => {
    if (!editForm.question.trim()) {
      showToast('Question text cannot be empty.', 'error');
      return;
    }
    const emptyOpts = editForm.options.filter(o => !o.trim());
    if (emptyOpts.length > 0) {
      showToast('All four options must be filled.', 'error');
      return;
    }

    const updated = [...questions];
    updated[editingIdx] = {
      ...updated[editingIdx],
      question: editForm.question.trim(),
      options: editForm.options.map(o => o.trim()),
      answer: editForm.answer,
    };
    setQuestions(updated);
    setEditingIdx(null);
    setHasChanges(true);
    showToast(`Question ${editingIdx + 1} updated.`);
  };

  // Start adding a new question
  const startAdd = () => {
    setIsAdding(true);
    setEditingIdx(null);
    setEditForm({ ...EMPTY_QUESTION, options: ['', '', '', ''] });
  };

  // Save new question
  const saveNewQuestion = () => {
    if (!editForm.question.trim()) {
      showToast('Question text cannot be empty.', 'error');
      return;
    }
    const emptyOpts = editForm.options.filter(o => !o.trim());
    if (emptyOpts.length > 0) {
      showToast('All four options must be filled.', 'error');
      return;
    }

    const newQ = {
      id: questions.length + 1,
      question: editForm.question.trim(),
      options: editForm.options.map(o => o.trim()),
      answer: editForm.answer,
    };
    setQuestions(prev => [...prev, newQ]);
    setIsAdding(false);
    setEditForm({ ...EMPTY_QUESTION });
    setHasChanges(true);
    showToast(`Question ${questions.length + 1} added.`);
  };

  // Delete a question
  const deleteQuestion = (idx) => {
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    setHasChanges(true);
    if (editingIdx === idx) cancelEdit();
    showToast(`Question ${idx + 1} deleted.`);
  };

  // Duplicate a question
  const duplicateQuestion = (idx) => {
    const dup = {
      ...questions[idx],
      id: questions.length + 1,
      question: questions[idx].question + ' (copy)',
    };
    const updated = [...questions];
    updated.splice(idx + 1, 0, dup);
    setQuestions(updated);
    setHasChanges(true);
    showToast(`Question ${idx + 1} duplicated.`);
  };

  // Move question up/down
  const moveQuestion = (idx, direction) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const updated = [...questions];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setQuestions(updated);
    setHasChanges(true);
  };

  // Export questions as JSON file
  const handleExportJSON = () => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", jsonStr);
    a.setAttribute("download", "safeexam_question_bank.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Question bank exported as JSON.');
  };

  // Import questions from JSON file
  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            showToast('Invalid JSON: must be a non-empty array of questions.', 'error');
            return;
          }
          // Basic validation
          for (const q of parsed) {
            if (!q.question || !Array.isArray(q.options) || q.options.length < 2 || q.answer === undefined) {
              showToast('Invalid question format found in imported JSON.', 'error');
              return;
            }
          }
          const indexed = parsed.map((q, idx) => ({
            id: idx + 1,
            question: q.question,
            options: q.options.length >= 4 ? q.options.slice(0, 4) : [...q.options, ...Array(4 - q.options.length).fill('')],
            answer: typeof q.answer === 'number' ? q.answer : 0,
          }));
          setQuestions(indexed);
          setHasChanges(true);
          showToast(`Imported ${indexed.length} questions. Click "Save to Exam Bank" to apply.`);
        } catch (err) {
          showToast('Failed to parse JSON file.', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Update an option in the edit form
  const updateOption = (optIdx, value) => {
    setEditForm(prev => {
      const newOptions = [...prev.options];
      newOptions[optIdx] = value;
      return { ...prev, options: newOptions };
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} className="glass">
        {/* Toast */}
        {toast && (
          <div style={{
            ...styles.toast,
            borderColor: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: toast.type === 'error' ? '#f87171' : '#34d399',
          }}>
            {toast.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={22} color="#6366f1" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>Question Bank Manager</h3>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {questions.length} question{questions.length !== 1 ? 's' : ''} in bank • 
                {isCustomized ? ' Custom bank active' : ' Using factory defaults'} •
                {Math.floor(100 / Math.max(questions.length, 1))} pts each
              </span>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        </div>

        {/* Toolbar */}
        <div style={styles.toolbar}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={startAdd} style={styles.toolBtn} disabled={isAdding}>
              <PlusCircle size={14} />
              Add Question
            </button>
            <button onClick={handleImportJSON} style={styles.toolBtn}>
              <Upload size={14} />
              Import JSON
            </button>
            <button onClick={handleExportJSON} style={styles.toolBtn}>
              <Download size={14} />
              Export JSON
            </button>
            <button onClick={handleResetDefaults} style={styles.toolBtnDanger}>
              <RotateCcw size={14} />
              Reset to Defaults
            </button>
          </div>

          <button
            onClick={handleSaveBank}
            disabled={!hasChanges}
            style={{
              ...styles.saveBtn,
              opacity: hasChanges ? 1 : 0.5,
            }}
            className={hasChanges ? 'pulsing' : ''}
          >
            <Save size={15} />
            Save to Exam Bank
          </button>
        </div>

        {hasChanges && (
          <div style={styles.unsavedBanner}>
            <AlertCircle size={14} />
            <span>You have unsaved changes. Click "Save to Exam Bank" to apply them to future exams.</span>
          </div>
        )}

        {/* Questions List */}
        <div style={styles.questionsList}>
          {questions.length === 0 && !isAdding && (
            <div style={styles.emptyState}>
              <FileText size={40} color="#334155" />
              <p style={{ color: '#64748b', marginTop: '0.75rem' }}>No questions in the bank. Add one or import a JSON file.</p>
            </div>
          )}

          {questions.map((q, idx) => (
            <div key={`q-${idx}`} style={{
              ...styles.questionCard,
              borderColor: editingIdx === idx ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)',
            }}>
              {editingIdx === idx ? (
                /* --- EDIT MODE --- */
                <div style={styles.editForm}>
                  <div style={styles.editHeader}>
                    <span style={styles.qBadge}>Editing Question {idx + 1}</span>
                  </div>

                  <label style={styles.formLabel}>Question Text</label>
                  <textarea
                    value={editForm.question}
                    onChange={e => setEditForm(prev => ({ ...prev, question: e.target.value }))}
                    rows={3}
                    style={styles.textarea}
                    placeholder="Enter the question..."
                  />

                  <label style={{ ...styles.formLabel, marginTop: '0.75rem' }}>Options (select the correct answer)</label>
                  <div style={styles.optionsEditGrid}>
                    {editForm.options.map((opt, optIdx) => (
                      <div key={optIdx} style={styles.optionEditRow}>
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, answer: optIdx }))}
                          style={{
                            ...styles.correctToggle,
                            backgroundColor: editForm.answer === optIdx ? '#10b981' : 'rgba(255,255,255,0.03)',
                            borderColor: editForm.answer === optIdx ? '#10b981' : 'rgba(255,255,255,0.1)',
                            color: editForm.answer === optIdx ? '#fff' : '#94a3b8',
                          }}
                          title={editForm.answer === optIdx ? 'This is the correct answer' : 'Click to mark as correct'}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={e => updateOption(optIdx, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          style={styles.optionInput}
                        />
                        {editForm.answer === optIdx && (
                          <span style={styles.correctTag}>✓ Key</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={styles.editActions}>
                    <button onClick={cancelEdit} style={styles.cancelEditBtn}>
                      <X size={14} />
                      Cancel
                    </button>
                    <button onClick={saveEdit} style={styles.saveEditBtn}>
                      <Save size={14} />
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                /* --- VIEW MODE --- */
                <div>
                  <div style={styles.viewHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                      <span style={styles.qNumber}>{idx + 1}</span>
                      <p style={styles.qText}>{q.question}</p>
                    </div>
                    <div style={styles.qActions}>
                      <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} style={styles.actionBtn} title="Move Up">
                        <ChevronUp size={14} />
                      </button>
                      <button onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} style={styles.actionBtn} title="Move Down">
                        <ChevronDown size={14} />
                      </button>
                      <button onClick={() => startEdit(idx)} style={styles.actionBtn} title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => duplicateQuestion(idx)} style={styles.actionBtn} title="Duplicate">
                        <Copy size={14} />
                      </button>
                      <button onClick={() => deleteQuestion(idx)} style={styles.actionBtnDanger} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={styles.optionsPreview}>
                    {q.options.map((opt, optIdx) => (
                      <span key={optIdx} style={{
                        ...styles.optionChip,
                        backgroundColor: q.answer === optIdx ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
                        borderColor: q.answer === optIdx ? '#10b981' : 'rgba(255,255,255,0.06)',
                        color: q.answer === optIdx ? '#34d399' : '#94a3b8',
                        fontWeight: q.answer === optIdx ? 'bold' : 'normal',
                      }}>
                        {String.fromCharCode(65 + optIdx)}. {opt}
                        {q.answer === optIdx && ' ✓'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add New Question Form */}
          {isAdding && (
            <div style={{ ...styles.questionCard, borderColor: 'rgba(16,185,129,0.5)' }}>
              <div style={styles.editForm}>
                <div style={styles.editHeader}>
                  <span style={{ ...styles.qBadge, backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', borderColor: 'rgba(16,185,129,0.3)' }}>
                    New Question #{questions.length + 1}
                  </span>
                </div>

                <label style={styles.formLabel}>Question Text</label>
                <textarea
                  value={editForm.question}
                  onChange={e => setEditForm(prev => ({ ...prev, question: e.target.value }))}
                  rows={3}
                  style={styles.textarea}
                  placeholder="Type your question here..."
                  autoFocus
                />

                <label style={{ ...styles.formLabel, marginTop: '0.75rem' }}>Options (select the correct answer)</label>
                <div style={styles.optionsEditGrid}>
                  {editForm.options.map((opt, optIdx) => (
                    <div key={optIdx} style={styles.optionEditRow}>
                      <button
                        type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, answer: optIdx }))}
                        style={{
                          ...styles.correctToggle,
                          backgroundColor: editForm.answer === optIdx ? '#10b981' : 'rgba(255,255,255,0.03)',
                          borderColor: editForm.answer === optIdx ? '#10b981' : 'rgba(255,255,255,0.1)',
                          color: editForm.answer === optIdx ? '#fff' : '#94a3b8',
                        }}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => updateOption(optIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        style={styles.optionInput}
                      />
                      {editForm.answer === optIdx && (
                        <span style={styles.correctTag}>✓ Key</span>
                      )}
                    </div>
                  ))}
                </div>

                <div style={styles.editActions}>
                  <button onClick={() => { setIsAdding(false); setEditForm({ ...EMPTY_QUESTION }); }} style={styles.cancelEditBtn}>
                    <X size={14} />
                    Cancel
                  </button>
                  <button onClick={saveNewQuestion} style={styles.saveEditBtn}>
                    <PlusCircle size={14} />
                    Add to Bank
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8, 12, 20, 0.88)', backdropFilter: 'blur(10px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal: { maxWidth: '820px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '1.75rem 2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  closeBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' },
  toolBtn: { display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
  toolBtnDanger: { display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
  saveBtn: { display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', color: '#fff', padding: '0.55rem 1.25rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.3)', transition: 'all 0.2s' },
  unsavedBanner: { display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', padding: '0.5rem 0.85rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#fbbf24' },
  toast: { position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid', borderRadius: '8px', padding: '0.5rem 0.9rem', fontSize: '0.78rem', zIndex: 10002, boxShadow: '0 6px 20px rgba(0,0,0,0.5)' },
  questionsList: { display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center' },
  questionCard: { backgroundColor: 'rgba(255,255,255,0.015)', border: '1px solid', borderRadius: '10px', padding: '1rem 1.25rem', transition: 'all 0.2s' },
  viewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' },
  qNumber: { width: '26px', height: '26px', borderRadius: '6px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.78rem', flexShrink: 0 },
  qText: { fontSize: '0.88rem', color: '#e2e8f0', margin: 0, lineHeight: '1.4', fontWeight: '500' },
  qActions: { display: 'flex', gap: '0.25rem', flexShrink: 0 },
  actionBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '5px', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center' },
  actionBtnDanger: { background: 'none', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '5px', color: '#f87171', cursor: 'pointer', padding: '0.25rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center' },
  optionsPreview: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem', marginLeft: '2.25rem' },
  optionChip: { display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', border: '1px solid' },

  // Edit Form Styles
  editForm: { display: 'flex', flexDirection: 'column' },
  editHeader: { marginBottom: '0.75rem' },
  qBadge: { display: 'inline-block', fontSize: '0.72rem', fontWeight: 'bold', color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', padding: '0.2rem 0.6rem', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' },
  formLabel: { fontSize: '0.72rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.35rem', display: 'block' },
  textarea: { width: '100%', padding: '0.7rem 0.85rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none', lineHeight: '1.5' },
  optionsEditGrid: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  optionEditRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  correctToggle: { width: '30px', height: '30px', borderRadius: '6px', border: '1.5px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 },
  optionInput: { flex: 1, padding: '0.55rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#f8fafc', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' },
  correctTag: { fontSize: '0.68rem', color: '#10b981', fontWeight: 'bold', flexShrink: 0 },
  editActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' },
  cancelEditBtn: { display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' },
  saveEditBtn: { display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' },
};
