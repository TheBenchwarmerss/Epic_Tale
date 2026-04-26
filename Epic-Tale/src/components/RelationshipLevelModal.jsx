import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import '../styles/RelationshipLevelModal.css';

const RELATIONSHIP_LEVELS = [
  { id: 0, label: 'Same Media Type & Series', description: 'Both are the same type and in the same series' },
  { id: 1, label: 'Different Type, Same Series', description: 'Different media types but in the same series' },
  { id: 2, label: 'Same Creator', description: 'Created by the same person/studio' },
];

export default function RelationshipLevelModal({ media1, media2, onClose, onSuccess }) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreateRelationship() {
    if (selectedLevel === null) return;

    setIsLoading(true);
    setError('');

    try {
      // Insert relationship in both directions
      const { error: error1 } = await supabase
        .from('relationships')
        .insert([
          {
            media_id_1: media1.id,
            media_id_2: media2.id,
            level: selectedLevel,
          },
        ]);

      const { error: error2 } = await supabase
        .from('relationships')
        .insert([
          {
            media_id_1: media2.id,
            media_id_2: media1.id,
            level: selectedLevel,
          },
        ]);

      if (error1 || error2) {
        setError(error1?.message || error2?.message || 'Failed to create relationship');
        setIsLoading(false);
        return;
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }

  return (
    <dialog className="modal modal-open bg-black/80 backdrop-blur-sm z-[100]">
      <div className="modal-box bg-base-200 shadow-2xl border border-base-content/10 max-w-lg">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={onClose}>✕</button>
        </form>
        <h3 className="font-bold text-2xl mb-2 text-primary">Create Relationship</h3>
        <p className="py-2 text-base-content/80">
          Creating relationship between <strong className="text-base-content">{media1?.name}</strong> and <strong className="text-base-content">{media2?.name}</strong>
        </p>

        <div className="flex flex-col gap-3 my-6">
          {RELATIONSHIP_LEVELS.map((level) => (
            <button
              key={level.id}
              className={`btn h-auto py-4 justify-start text-left border ${
                selectedLevel === level.id 
                  ? 'btn-primary border-primary ring-2 ring-primary/30' 
                  : 'btn-outline border-base-content/20 hover:border-primary/50 bg-base-100'
              }`}
              onClick={() => setSelectedLevel(level.id)}
            >
              <div className="flex items-center gap-4 w-full">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedLevel === level.id ? 'border-primary-content bg-primary-content text-primary' : 'border-base-content/30'
                }`}>
                  {selectedLevel === level.id && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                </div>
                <div className="flex flex-col gap-1">
                  <div className={`font-bold text-base ${selectedLevel === level.id ? 'text-primary-content' : 'text-base-content'}`}>{level.label}</div>
                  <div className={`font-normal text-xs ${selectedLevel === level.id ? 'text-primary-content/80' : 'text-base-content/60'}`}>{level.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="alert alert-error shadow-sm mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
          </div>
        )}

        <div className="modal-action mt-6">
          <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="btn btn-primary px-8"
            onClick={handleCreateRelationship}
            disabled={selectedLevel === null || isLoading}
          >
            {isLoading ? <span className="loading loading-spinner"></span> : 'Create Relationship'}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
