import { useState, useEffect, useContext } from 'react';
import { supabase } from '../../utils/supabase';
import { Link, useSearchParams } from 'react-router-dom';
import { RelationshipContext } from '../contexts/RelationshipContext';
import RelationshipCheckbox from '../components/RelationshipCheckbox';
import RelationshipLevelModal from '../components/RelationshipLevelModal';

function getMediaType(type) {
    const value = (type || '').toLowerCase();

    if (value.includes('book')) return 'book';
    if (value.includes('film') || value.includes('movie')) return 'film';
    if (value.includes('game')) return 'game';

    return 'other';
}

function TypeIcon({ type, className = 'h-6 w-6' }) {
    if (type === 'book') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h12a2 2 0 012 2v15l-4-2-4 2-4-2-4 2V5z" />
            </svg>
        );
    }

    if (type === 'film') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 6v12M16 6v12M4 10h16M4 14h16" />
            </svg>
        );
    }

    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 10h10a3 3 0 013 3v1a3 3 0 01-3 3H7a3 3 0 01-3-3v-1a3 3 0 013-3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10l2-2h4l2 2" />
            <circle cx="9" cy="14" r="1" fill="currentColor" />
            <circle cx="15" cy="14" r="1" fill="currentColor" />
        </svg>
    );
}

export default function Home() {
    const [media, setMedia] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [mediaWithRelationships, setMediaWithRelationships] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [selectedPair, setSelectedPair] = useState(null);
    const [searchParams] = useSearchParams();

    const { selectedMediaIds, clearSelection, relationshipMode } = useContext(RelationshipContext);
    const searchQuery = searchParams.get('q') || '';

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
            item.Creators?.creator?.toLowerCase().includes(lowerCaseQuery) ||
            item.types?.type?.toLowerCase().includes(lowerCaseQuery)
        );
    });

    const recommendationMedia = filteredMedia.slice(0, 3);

    const categoryTiles = [
        { key: 'book', label: 'Books >', query: 'book' },
        { key: 'film', label: 'Films >', query: 'film' },
        { key: 'game', label: 'Games >', query: 'game' },
    ].map((tile) => ({
        ...tile,
        media: media.find((item) => getMediaType(item.types?.type) === tile.key),
    }));

    function getCreatorLine(itemType, creator) {
        if (!creator) return '';

        if (itemType === 'book') return `By: ${creator}`;
        if (itemType === 'film') return `Directed By: ${creator}`;
        return creator;
    }

    return (
        <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
            <section className="bg-[#9ca3b5] px-4 py-5 sm:px-8 sm:py-8 lg:px-12">
                <div className="mx-auto max-w-[1300px]">
                    <h1 className="text-center text-4xl font-black text-[#0a2238] sm:text-5xl">Current Reccomendations</h1>

                    <div className="mt-8 flex flex-col gap-6">
                {isLoading && (
                            <div className="flex justify-center p-12">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                )}

                {errorMessage && (
                            <div className="mx-auto max-w-3xl alert alert-error shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{errorMessage}</span>
                    </div>
                )}

                {!isLoading && !errorMessage && media.length === 0 && (
                            <div className="mx-auto max-w-3xl rounded-3xl bg-[#f0dcdb] p-12 text-center text-[#0a2238]/70 shadow-md">
                        <p className="text-lg">No media found.</p>
                        <p className="text-sm mt-2">Try adding some new entries!</p>
                    </div>
                )}

                {!isLoading && !errorMessage && media.length > 0 && filteredMedia.length === 0 && (
                            <div className="mx-auto max-w-3xl rounded-3xl bg-[#f0dcdb] p-8 text-center text-[#0a2238]/70 shadow-md">
                        <p className="text-lg">No media found for that search.</p>
                    </div>
                )}

                        {!isLoading && !errorMessage && recommendationMedia.length > 0 && (
                            <div className="flex flex-nowrap items-start gap-6 overflow-x-auto pb-2">
                                {recommendationMedia.map((item) => {
                                    const itemType = getMediaType(item.types?.type);
                                    const creatorLine = getCreatorLine(itemType, item.Creators?.creator);
                                    const typeLabel = item.types?.type || 'Media';

                    return (
                                        <div key={item.id} className="flex w-[390px] shrink-0 flex-col gap-3">
                                            <div className="flex items-center justify-center gap-3 md:justify-start">
                                {relationshipMode && (
                                                    <div className="flex-none">
                                        <RelationshipCheckbox mediaId={item.id} />
                                    </div>
                                )}
                                                <Link to={`/detail/${item.id}`} className="w-[390px] hover:no-underline">
                                                    <article
                                                        className="mx-auto flex h-[460px] w-[390px] flex-col items-center rounded-[28px] bg-[#f0dcdb] px-6 py-6 text-[#0a2238] shadow-md transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
                                                    >
                                                        <h2 className="min-h-[4.5rem] text-center text-[2rem] font-extrabold leading-tight line-clamp-2">{item.name}</h2>

                                                        <div className="mt-3 h-64 w-44 overflow-hidden rounded-md shadow">
                                                            <img
                                                                src={item.image_url || ''}
                                                                alt={item.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>

                                                        <div className="mt-4 min-h-[2.75rem] w-full text-left text-sm font-semibold text-[#4f6982]">
                                                            {itemType === 'film' && item.description && (
                                                                <p className="line-clamp-1">Series: {item.description}</p>
                                                            )}
                                                            {creatorLine && (
                                                                <p className="line-clamp-1">{creatorLine}</p>
                                                            )}
                                                            {!creatorLine && item.description && (
                                                                <p className="line-clamp-2">{item.description}</p>
                                                            )}
                                                        </div>

                                                        <div className="mt-3 flex items-center justify-center gap-4 text-[#556f86]">
                                                            <TypeIcon type={itemType} className="h-6 w-6" />
                                                            <span className="rounded-full bg-[#5e7387] px-3 py-1 text-xs font-bold tracking-wide text-white">
                                                                {typeLabel}
                                                            </span>
                                                        </div>
                                                    </article>
                                                </Link>
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="bg-[#ddc1ac] px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
                <div className="flex gap-6">
                    {categoryTiles.map((tile) => (
                        <Link
                            key={tile.key}
                            to={`/?q=${encodeURIComponent(tile.query)}`}
                            className="group  h-[32px] w-[190px] shrink-0 overflow-hidden rounded-[20px] bg-[#07223d] shadow-lg md:h-40 md:w-[220px]"
                        >
                            {tile.media?.image_url && (
                                <img
                                    src={tile.media.image_url}
                                    alt={tile.label}
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            )}
                            <div className="absolute inset-0 bg-[#07223d]/70"></div>
                            <div className="absolute inset-0 flex items-end p-4">
                                <span className="text-3xl font-black tracking-wide text-[#f0dcdb] md:text-[2rem]">{tile.label}</span>
                            </div>
                        </Link>
                    ))}

                    <Link
                        to="/add"
                        className="group relative h-32 w-[190px] shrink-0 overflow-hidden rounded-[20px] bg-[#07223d] shadow-lg md:h-40 md:w-[220px]"
                    >
                        <div className="absolute inset-0 bg-[#07223d]"></div>
                        <div className="absolute inset-0 flex items-end p-4">
                            <span className="text-3xl font-black tracking-wide text-[#f0dcdb] transition-transform duration-200 group-hover:translate-x-1 md:text-[2rem]">Add +</span>
                        </div>
                    </Link>
                </div>
            </section>

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
