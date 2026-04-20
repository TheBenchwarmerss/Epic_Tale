import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export default function NewMedia() {
    const [media, setMedia] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [form, setForm] = useState({ name: '', description: '', author: '', type_id: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [types, setTypes] = useState([])

    useEffect(() => {
        async function getTypes() {
            const { data, error } = await supabase
                .from('types')
                .select('id, type')
                .order('type', { ascending: true })
            if (!error) setTypes(data)
        }
        getTypes()
    }, [])

    useEffect(() => {
        async function getMedia() {
            setIsLoading(true)
            setErrorMessage('')
            const { data, error } = await supabase
                .from('media')
                .select('id, name, description, Creators(creator), types(type)')
                .order('id', { ascending: true })

            if (error) {
                setErrorMessage(error.message)
            } else {
                setMedia(data)
            }
            setIsLoading(false)
        }
        getMedia()
    }, [])

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorMessage('')
        setSuccessMessage('')

        // Check if the author already exists in the Creators table
        let authorId = null
        const { data: existingCreators, error: lookupError } = await supabase
            .from('Creators')
            .select('id')
            .ilike('creator', form.author)
            .limit(1)

        if (lookupError) {
            setErrorMessage(lookupError.message)
            setIsSubmitting(false)
            return
        }

        if (existingCreators && existingCreators.length > 0) {
            // Author exists — reuse their ID
            authorId = existingCreators[0].id
        } else {
            // Author does not exist — create them
            const { data: newCreator, error: insertCreatorError } = await supabase
                .from('Creators')
                .insert([{ creator: form.author }])
                .select('id')
                .single()

            if (insertCreatorError) {
                setErrorMessage(insertCreatorError.message)
                setIsSubmitting(false)
                return
            }
            authorId = newCreator.id
        }

        // Insert media with the resolved author ID
        const { error: mediaError } = await supabase
            .from('media')
            .insert([{ name: form.name, description: form.description, creator_id: authorId, type_id: form.type_id }])

        if (mediaError) {
            setErrorMessage(mediaError.message)
        } else {
            setSuccessMessage('Media added successfully!')
            setForm({ name: '', description: '', author: '', type_id: '' })
        }
        setIsSubmitting(false)
    }

    return (
        <div>
            <h2>Add New Media</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Name</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="description">Description</label>
                    <input
                        id="description"
                        name="description"
                        type="text"
                        value={form.description}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="author">Author</label>
                    <input
                        id="author"
                        name="author"
                        type="text"
                        value={form.author}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="type_id">Type</label>
                    <select
                        id="type_id"
                        name="type_id"
                        value={form.type_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a type</option>
                        {types.map((t) => (
                            <option key={t.id} value={t.id}>{t.type}</option>
                        ))}
                    </select>
                </div>
                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Add Media'}
                </button>
            </form>

            <h2>Media List</h2>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <ul>
                    {media.map((item) => (
                        <li key={item.id}>
                            <strong>{item.name}</strong> — {item.types?.type} by {item.Creators?.creator}: {item.description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}