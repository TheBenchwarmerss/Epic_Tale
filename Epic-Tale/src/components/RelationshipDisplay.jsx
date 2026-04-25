import { Link } from 'react-router-dom';
import { useState } from 'react';
import '../styles/RelationshipDisplay.css';

const RELATIONSHIP_LABELS = [
  'Same Media Type & Series',
  'Different Type, Same Series',
  'Same Creator',
];

export default function RelationshipDisplay({ parentMediaId, parentMediaName, relationships, onDeleteRelationship }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!relationships || relationships.length === 0) {
    return null;
  }

  return (
    <div className="relationships-section">
      <button
        className="relationships-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="toggle-arrow">{isOpen ? '▼' : '▶'}</span>
        <h3 className="relationships-title">Related Media ({relationships.length})</h3>
      </button>

      {isOpen && (
        <div className="relationships-list">
          {relationships.map((rel) => (
            <div key={`${rel.mediaId}-${rel.level}`} className="relationship-item">
              <Link
                to={`/detail/${rel.mediaId}`}
                className="relationship-link"
                title={RELATIONSHIP_LABELS[rel.level]}
              >
                <span className="rel-name">{rel.name}</span>
                <span className="rel-type">({rel.types?.type})</span>
                <span className="rel-level">[{RELATIONSHIP_LABELS[rel.level]}]</span>
              </Link>
              {onDeleteRelationship && (
                <button
                  className="relationship-delete"
                  onClick={() => onDeleteRelationship(parentMediaId, parentMediaName, rel.mediaId, rel.name)}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
