import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import RelationshipDisplay from '../components/RelationshipDisplay';

export default function MediaDetail() {
    const { id } = useParams();
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
                .select('id, name, description, Creators(creator), types(type)')
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
        return <div className="detail-container"><p>Loading...</p></div>;
    }

    if (error) {
        return <div className="detail-container"><p style={{ color: 'red' }}>Error: {error}</p></div>;
    }

    if (!mediaDetails) {
        return <div className="detail-container"><p>Media not found.</p></div>;
    }

    return (
        <div className="detail-container">
            <div className="detail-top">
                <div className="cover-photo-container">
                    <div className="placeholder-cover">
                        <h2>?</h2>
                        <div>Cover Pending</div>
                    </div>
                </div>
                <div className="detail-info">
                    <h1>{mediaDetails.name}</h1>
                    <p className="series">Type: {mediaDetails.types?.type}</p>
                    <p className="series">Creator: {mediaDetails.Creators?.creator}</p>
                    <p>{mediaDetails.description}</p>
                </div>
            </div>

            {relationships.length > 0 && (
                <RelationshipDisplay
                    parentMediaId={mediaDetails.id}
                    parentMediaName={mediaDetails.name}
                    relationships={relationships}
                    onDeleteRelationship={handleDeleteRelationship}
                />
            )}
        </div>
    );
}
