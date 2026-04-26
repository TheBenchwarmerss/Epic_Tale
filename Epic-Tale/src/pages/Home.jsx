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
    const [searchQuery, setSearchQuery] = useState('');

    const { selectedMediaIds, clearSelection, relationshipMode } = useContext(RelationshipContext);

    useEffect(() => {
        async function getMedia() {
            setIsLoading(true);
            setErrorMessage('');
            const { data, error } = await supabase
                .from('media')
                .select('id, name, description, image_url, Creators(creator), types(type)')
                .order('id', { ascending: true });

            if (error) {
                setErrorMessage(error.message);
            } else {
                setMedia(data ?? []);
                await loadAllRelationships(data ?? []);
            }
            setIsLoading(false);
        }
        getMedia();
    }, []);

    useEffect(() => {
        // used ai for help idk how to do this part
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

    const filteredMedia = media.filter((item) => {
        if (!searchQuery) return true;
        const lowerCaseQuery = searchQuery.toLowerCase();
        
        return (
            item.name?.toLowerCase().includes(lowerCaseQuery) ||
            item.description?.toLowerCase().includes(lowerCaseQuery) ||
            item.Creators?.creator?.toLowerCase().includes(lowerCaseQuery)
        );
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-base-200 p-4 rounded-box shadow-sm">
                <input
                    type="text"
                    className="input input-bordered w-full sm:max-w-md bg-base-100"
                    placeholder="Search media..."
                />
                <button className="btn btn-neutral btn-outline">Filters</button>
        <>
            <div className="list-header">
                <input type="text" className="search-bar" style={{ maxWidth: '400px' }} placeholder="search" value={searchQuery}onChange={(e) => setSearchQuery(e.target.value)}/>
                <button className="btn-filter">Filters</button>
            </div>

            <div className="flex flex-col gap-4">
                {isLoading && (
                    <div className="flex justify-center p-12">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                )}
                {errorMessage && (
                    <div className="alert alert-error shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{errorMessage}</span>
                    </div>
                )}

                {!isLoading && !errorMessage && media.length === 0 && (
                    <div className="text-center p-12 bg-base-200 rounded-box text-base-content/60">
                        <p className="text-lg">No media found.</p>
                        <p className="text-sm mt-2">Try adding some new entries!</p>
                    </div>
                )}

                {!isLoading && !errorMessage && media.map((item) => {
                {!isLoading && !errorMessage && filteredMedia.length === 0 && (
                    <p>No media found.</p>
                )}

                {filteredMedia.map((item) => {
                    const relationships = mediaWithRelationships[item.id] || [];

                    return (
                        <div key={item.id} className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                                {relationshipMode && (
                                    <div className="flex-none">
                                        <RelationshipCheckbox mediaId={item.id} />
                                    </div>
                                )}
                                <Link to={`/detail/${item.id}`} className="flex-1 hover:no-underline">
                                    <div className="card bg-primary text-primary-content shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-primary-content/10">
                                        <div className="card-body p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
                                            <div className="flex-1">
                                                <h2 className="card-title text-xl font-bold mb-1">{item.name}</h2>
                                                <p className="text-sm opacity-80 line-clamp-2">{item.description}</p>
                                            </div>
                                            <div className="flex-none flex flex-row sm:flex-col gap-2 justify-between sm:justify-center items-center sm:items-end sm:w-32">
                                                {item.types?.type && (
                                                    <span className="badge badge-neutral shadow-sm">{item.types.type}</span>
                                                )}
                                                <span className="text-xs opacity-75 font-medium text-right">
                                                    {item.Creators?.creator}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                            {relationships.length > 0 && (
                                <div className="pl-0 sm:pl-12">
                                    <RelationshipDisplay
                                        parentMediaId={item.id}
                                        parentMediaName={item.name}
                                        relationships={relationships}
                                        onDeleteRelationship={handleDeleteRelationship}
                                    />
                                </div>
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
        </div>
    );
}
