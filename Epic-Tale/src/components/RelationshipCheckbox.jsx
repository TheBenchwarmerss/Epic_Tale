import { useContext } from 'react';
import { RelationshipContext } from '../contexts/RelationshipContext';
import '../styles/RelationshipCheckbox.css';

export default function RelationshipCheckbox({ mediaId }) {
  const { selectedMediaIds, toggleMediaSelection } = useContext(RelationshipContext);
  const isSelected = selectedMediaIds.includes(mediaId);

  return (
    <input 
      type="checkbox" 
      className="toggle toggle-primary"
      checked={isSelected}
      onChange={() => toggleMediaSelection(mediaId)}
      title={isSelected ? 'Deselect' : 'Select'}
    />
  );
}
