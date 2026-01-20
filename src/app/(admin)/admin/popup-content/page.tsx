"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash, Edit } from 'lucide-react';

interface PopupQuestion {
  id: string;
  text: string;
  type: 'TEXT' | 'OPTIONS';
  options: string[];
  order: number;
}

export default function PopupEditor() {
  const [formData, setFormData] = useState({
    mainHeading: '',
    subHeading: '',
    offerPrice: '',
    originalPrice: '',
    continueButtonText: '',
    lastQuestionButtonText: '',
    imageUrl: '',
    conciergeTitle: '',
    conciergePrice: '',
    conciergeOfferPrice: '',
    lastChanceText: ''
  });
  const [questions, setQuestions] = useState<PopupQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<PopupQuestion> | null>(null);

  const fetchContent = () => {
    axios.get('/api/popup-content').then(res => {
      if (res.data.success) {
        const { questions, ...data } = res.data.data;
        setFormData({ ...data, continueButtonText: data.continueButtonText || 'Continue' });
        setQuestions(questions || []);
      }
    });
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        continueButtonText: formData.continueButtonText || 'Continue', // Ensure it's never empty
      };
      await axios.post('/api/popup-content', dataToSave);
      alert("Popup Content Updated!");
    } catch (err) {
      alert("Error saving data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePopup = async () => {
    if (window.confirm('Are you sure you want to delete the entire popup content? This action cannot be undone.')) {
      try {
        await axios.delete('/api/popup-content');
        alert('Popup content deleted successfully.');
        // Optionally, refetch or redirect
        fetchContent();
      } catch (err) {
        alert('Error deleting popup content.');
      }
    }
  };

  const handleOpenModal = (question: Partial<PopupQuestion> | null = null) => {
    setCurrentQuestion(question ? { ...question } : { text: '', type: 'TEXT', options: [], order: questions.length });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentQuestion(null);
  };

  const handleSaveQuestion = async () => {
    if (!currentQuestion) return;

    const apiCall = currentQuestion.id
      ? axios.put(`/api/popup-questions/${currentQuestion.id}`, currentQuestion)
      : axios.post('/api/popup-questions', { ...currentQuestion, popupContentId: 'current' });

    try {
      await apiCall;
      fetchContent(); // Refetch all content to get the updated list
      handleCloseModal();
    } catch (err) {
      alert('Error saving question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await axios.delete(`/api/popup-questions/${id}`);
        fetchContent(); // Refetch
      } catch (err) {
        alert('Error deleting question');
      }
    }
  };

  const inputStyle = "w-full p-2 border border-gray-300 rounded text-black mb-4";

  return (
    <div className="p-10 max-w-4xl mx-auto bg-white shadow-lg rounded-xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 border-b pb-2">Popup Content Editor</h1>
        <button onClick={handleDeletePopup} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-all">
          Delete Popup
        </button>
      </div>
      
      {/* Main Content Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Left Column */}
        <div>
          <label className="font-bold text-sm">Main Heading</label>
          <textarea className={inputStyle} rows={2} value={formData.mainHeading} onChange={(e) => setFormData({...formData, mainHeading: e.target.value})} />
          
          <label className="font-bold text-sm">Sub Heading</label>
          <input className={inputStyle} type="text" value={formData.subHeading} onChange={(e) => setFormData({...formData, subHeading: e.target.value})} />
          
          <label className="font-bold text-sm">Continue Button Text</label>
          <input className={inputStyle} type="text" value={formData.continueButtonText} onChange={(e) => setFormData({...formData, continueButtonText: e.target.value})} />

          <label className="font-bold text-sm">Last Question Button Text</label>
          <input className={inputStyle} type="text" value={formData.lastQuestionButtonText} onChange={(e) => setFormData({...formData, lastQuestionButtonText: e.target.value})} />
        </div>

        {/* Right Column */}
        <div>
          <label className="font-bold text-sm">Offer Price</label>
          <input className={inputStyle} type="text" value={formData.offerPrice} onChange={(e) => setFormData({...formData, offerPrice: e.target.value})} />
          
          <label className="font-bold text-sm">Original Price</label>
          <input className={inputStyle} type="text" value={formData.originalPrice} onChange={(e) => setFormData({...formData, originalPrice: e.target.value})} />
          
          <label className="font-bold text-sm">Image URL</label>
          <input className={inputStyle} type="text" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
        </div>
      </div>
      {/* Concierge & Last Chance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="font-bold text-sm">Concierge Title</label>
          <input className={inputStyle} type="text" value={formData.conciergeTitle} onChange={(e) => setFormData({...formData, conciergeTitle: e.target.value})} />
        </div>
        <div>
          <label className="font-bold text-sm">Concierge Price</label>
          <input className={inputStyle} type="text" value={formData.conciergePrice} onChange={(e) => setFormData({...formData, conciergePrice: e.target.value})} />
        </div>
        <div>
          <label className="font-bold text-sm">Concierge Offer Price</label>
          <input className={inputStyle} type="text" value={formData.conciergeOfferPrice} onChange={(e) => setFormData({...formData, conciergeOfferPrice: e.target.value})} />
        </div>
      </div>
      <div>
        <label className="font-bold text-sm">Last Chance Text</label>
        <input className={inputStyle} type="text" value={formData.lastChanceText} onChange={(e) => setFormData({...formData, lastChanceText: e.target.value})} />
      </div>

      <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all mt-4">
        {loading ? "Saving..." : "Save Content Changes"}
      </button>

      {/* Questions Management */}
      <div className="mt-10">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-xl font-bold text-gray-800">Manage Questions</h2>
            <button onClick={() => handleOpenModal()} className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 flex items-center">
                <Plus size={20} className="mr-1" /> Add New Question
            </button>
        </div>
        <div className="space-y-2">
          {questions.sort((a, b) => a.order - b.order).map(q => (
            <div key={q.id} className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
              <div>
                <p className="font-semibold text-black">{q.text}</p>
                <p className="text-sm text-gray-600">Type: {q.type} | Options: {q.options.join(', ')}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleOpenModal(q)} className="text-blue-500 hover:text-blue-700"><Edit size={20}/></button>
                <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-700"><Trash size={20}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Question Modal */}
      {isModalOpen && currentQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4 text-black">{currentQuestion.id ? 'Edit Question' : 'Add New Question'}</h3>
            <label className="font-bold text-sm text-black">Question Text</label>
            <input type="text" className={inputStyle} value={currentQuestion.text} onChange={e => setCurrentQuestion({...currentQuestion, text: e.target.value})} />
            
            <label className="font-bold text-sm text-black">Question Type</label>
            <select className={inputStyle} value={currentQuestion.type} onChange={e => setCurrentQuestion({...currentQuestion, type: e.target.value as 'TEXT' | 'OPTIONS'})}>
              <option value="TEXT">Text Input</option>
              <option value="OPTIONS">Options (Radio)</option>
            </select>

            {currentQuestion.type === 'OPTIONS' && (
              <div>
                <label className="font-bold text-sm text-black">Options (comma-separated)</label>
                <input type="text" className={inputStyle} value={currentQuestion.options?.join(',')} onChange={e => setCurrentQuestion({...currentQuestion, options: e.target.value.split(',').map(s => s.trim())})} />
              </div>
            )}
            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={handleCloseModal} className="text-gray-600">Cancel</button>
              <button onClick={handleSaveQuestion} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
