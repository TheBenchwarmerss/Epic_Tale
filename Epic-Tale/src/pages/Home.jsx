import { useState, useEffect, useContext } from 'react';
import { supabase } from '../../utils/supabase';
import { Link } from 'react-router-dom';
import { RelationshipContext } from '../contexts/RelationshipContext';
import RelationshipCheckbox from '../components/RelationshipCheckbox';
import RelationshipLevelModal from '../components/RelationshipLevelModal';
import RelationshipDisplay from '../components/RelationshipDisplay';

export default function Home() {
    const [media, setMedia] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [mediaWithRelationships, setMediaWithRelationships] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [selectedPair, setSelectedPair] = useState(null);

    const { selectedMediaIds, clearSelection, relationshipMode } = useContext(RelationshipContext);

    useEffect(() => {
        async function getMedia() {
            setIsLoading(true);
            setErrorMessage('');
            const { data, error } = await supabase
                .from('media')
                .select('id, name, description, Creators(creator), types(type)')
                .order('id', { ascending: true });

            if (error) {
                setErrorMessage(error.message);
            } else {
                setMedia(data ?? []);
                // Load relationships for all media
                await loadAllRelationships(data ?? []);
            }
            setIsLoading(false);
        }
        getMedia();
    }, []);

    useEffect(() => {
        // Check if two media are selected
        if (selectedMediaIds.length === 2 && relationshipMode) {
            const media1 = media.find((m) => m.id === selectedMediaIds[0]);
            const media2 = media.find((m) => m.id === selectedMediaIds[1]);
            setSelectedPair({ media1, media2 });
            setShowModal(true);
        }
    }, [selectedMediaIds, media, relationshipMode]);

    async function loadAllRelationships(mediaList) {
        const rels = {};
        for (const item of mediaList) {
            const { data, error } = await supabase
                .from('relationships')
                .select('media_id_2, level')
                .eq('media_id_1', item.id);

            if (!error && data) {
                const relatedIds = data.map((r) => r.media_id_2);
                if (relatedIds.length > 0) {
                    const { data: relatedMedia } = await supabase
                        .from('media')
                        .select('id, name, types(type)')
                        .in('id', relatedIds);

                    // Match relationships with media data
                    rels[item.id] = data.map((rel) => {
                        const media = relatedMedia?.find((m) => m.id === rel.media_id_2);
                        return {
                            mediaId: rel.media_id_2,
                            level: rel.level,
                            name: media?.name,
                            types: media?.types,
                        };
                    });
                }
            }
        }
        setMediaWithRelationships(rels);
    }

    async function handleRelationshipCreated() {
        // Reload relationships
        await loadAllRelationships(media);
        clearSelection();
    }

    async function handleDeleteRelationship(fromMediaId, fromMediaName, toMediaId, toMediaName) {
        const confirmed = window.confirm(
            `Are you sure you want to delete the relationship between ${fromMediaName} and ${toMediaName}?`
        );

        if (!confirmed) {
            return;
        }

        const { error } = await supabase
            .from('relationships')
            .delete()
            .or(
                `and(media_id_1.eq.${fromMediaId},media_id_2.eq.${toMediaId}),and(media_id_1.eq.${toMediaId},media_id_2.eq.${fromMediaId})`
            );

        if (error) {
            console.error('Delete relationship error:', error.message);
            return;
        }

        await loadAllRelationships(media);
        clearSelection();
    }

    return (
        <>
            <div className="list-header">
                <input type="text" className="search-bar" style={{ maxWidth: '400px' }} placeholder="search" />
                <button className="btn-filter">Filters</button>
            </div>

            <div className="list-container">
                {isLoading && <p>Loading media...</p>}
                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

                {!isLoading && !errorMessage && media.length === 0 && (
                    <p>No media found.</p>
                )}

                {media.map((item) => {
                    const relationships = mediaWithRelationships[item.id] || [];

                    return (
                        <div key={item.id} className="media-item-wrapper">
                            <div className="media-item-main">
                                {relationshipMode && <RelationshipCheckbox mediaId={item.id} />}
                                <Link to={`/detail/${item.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                                    <div className="list-item">
                                        <div className="list-title">{item.name}</div>
                                        <div className="list-desc">{item.description}</div>
                                        <div className="list-meta">
                                            <div>{item.types?.type}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{item.Creators?.creator}</div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                            {relationships.length > 0 && (
                                <RelationshipDisplay
                                    parentMediaId={item.id}
                                    parentMediaName={item.name}
                                    relationships={relationships}
                                    onDeleteRelationship={handleDeleteRelationship}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {showModal && selectedPair && (
                <RelationshipLevelModal
                    media1={selectedPair.media1}
                    media2={selectedPair.media2}
                    onClose={() => {
                        setShowModal(false);
                        clearSelection();
                    }}
                    onSuccess={handleRelationshipCreated}
                />
            )}
        </>
    );
}
