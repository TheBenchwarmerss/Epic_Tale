import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import RelationshipDisplay from '../components/RelationshipDisplay';

export default function MediaDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mediaDetails, setMediaDetails] = useState(null);
    const [relationships, setRelationships] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function getMediaDetails() {
            setIsLoading(true);
            setError('');

            // Get media details
            const { data: mediaData, error: mediaError } = await supabase
                .from('media')
                .select('id, name, description, image_url, Creators(creator), types(type)')
                .eq('id', id)
                .single();

            if (mediaError) {
                setError(mediaError.message);
                setIsLoading(false);
                return;
            }

            setMediaDetails(mediaData);

            // Get relationships
            const { data: relData, error: relError } = await supabase
                .from('relationships')
                .select('media_id_2, level')
                .eq('media_id_1', id);

            if (!relError && relData) {
                const relatedIds = relData.map((r) => r.media_id_2);
                if (relatedIds.length > 0) {
                    const { data: relatedMedia } = await supabase
                        .from('media')
                        .select('id, name, types(type)')
                        .in('id', relatedIds);

                    const rels = relData.map((rel) => {
                        const media = relatedMedia?.find((m) => m.id === rel.media_id_2);
                        return {
                            mediaId: rel.media_id_2,
                            level: rel.level,
                            name: media?.name,
                            types: media?.types,
                        };
                    });
                    setRelationships(rels);
                } else {
                    setRelationships([]);
                }
            } else if (relError) {
                setRelationships([]);
            }

            setIsLoading(false);
        }

        getMediaDetails();
    }, [id]);

    async function handleDeleteMedia() {
        const confirmed = window.confirm(`Are you sure you want to completely delete "${mediaDetails.name}"? This action cannot be undone.`);
        if (!confirmed) return;

        const { error } = await supabase.from('media').delete().eq('id', id);

        if (error) {
            console.error('Delete media error:', error.message);
            alert(`Failed to delete: ${error.message}`);
            return;
        }

        navigate('/');
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

        // reload relationships after deletion
        const { data: relData, error: relError } = await supabase
            .from('relationships')
            .select('media_id_2, level')
            .eq('media_id_1', id);

        if (!relError && relData) {
            const relatedIds = relData.map((r) => r.media_id_2);
            if (relatedIds.length > 0) {
                const { data: relatedMedia } = await supabase
                    .from('media')
                    .select('id, name, types(type)')
                    .in('id', relatedIds);

                const rels = relData.map((rel) => {
                    const media = relatedMedia?.find((m) => m.id === rel.media_id_2);
                    return {
                        mediaId: rel.media_id_2,
                        level: rel.level,
                        name: media?.name,
                        types: media?.types,
                    };
                });
                setRelationships(rels);
            } else {
                setRelationships([]);
            }
        } else {
            setRelationships([]);
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error shadow-lg max-w-2xl mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Error: {error}</span>
            </div>
        );
    }

    if (!mediaDetails) {
        return (
            <div className="text-center p-12 bg-base-200 rounded-box text-base-content/60 max-w-2xl mx-auto">
                <p className="text-lg">Media not found.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto py-4">
            <div className="card md:card-side bg-base-200 shadow-xl overflow-hidden">
                <figure className="w-full md:w-1/3 bg-base-300 flex items-center justify-center p-16 md:p-0 min-h-[350px] border-b md:border-b-0 md:border-r border-base-content/10">
                    <div className="cover-photo-container">
                    {mediaDetails.image_url ? (
                        <img 
                            src={mediaDetails.image_url} 
                            alt={mediaDetails.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} 
                        />
                    ) : (
                        <div className="placeholder-cover">
                            <h2>?</h2>
                            <div>Cover Pending</div>
                        </div>
                    )}
                </div>
                </figure>
                <div className="card-body md:w-2/3 p-6 md:p-8 flex flex-col justify-center">
                    <h1 className="card-title text-3xl md:text-4xl font-bold mb-2">{mediaDetails.name}</h1>
                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="badge badge-primary">{mediaDetails.types?.type}</span>
                        <span className="badge badge-outline">{mediaDetails.Creators?.creator}</span>
                    </div>
                    <p className="text-lg opacity-90 leading-relaxed mb-6">{mediaDetails.description}</p>
                </div>
                    <div className="card-actions justify-end mt-auto pt-4 border-t border-base-content/10">
                        <button onClick={handleDeleteMedia} className="btn btn-error btn-outline hover:bg-error hover:text-error-content transition-colors shadow-sm">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           Delete Item
                        </button>
                    </div>
                </div>
        <div className="detail-container">
            {relationships.length > 0 && (
                <div className="bg-base-200/50 p-6 rounded-box shadow-inner">
                    <h2 className="text-2xl font-bold mb-4 px-2">Relationships</h2>
                    <RelationshipDisplay
                        parentMediaId={mediaDetails.id}
                        parentMediaName={mediaDetails.name}
                        relationships={relationships}
                        onDeleteRelationship={handleDeleteRelationship}
                    />
                </div>
            )}
        </div>
        </div>
    );
}
