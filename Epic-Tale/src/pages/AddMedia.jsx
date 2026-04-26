import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

export default function AddMedia() {
    const [form, setForm] = useState({ name: '', description: '', author: '', type_id: '', image_url: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [types, setTypes] = useState([])

    useEffect(() => {
        async function getTypes() {
            const { data, error } = await supabase
                .from('types')
                .select('id, type')
                .order('type', { ascending: true })

            if (!error) {
                setTypes(data)
            }
        }

        getTypes()
    }, [])

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorMessage('')
        setSuccessMessage('')

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
            authorId = existingCreators[0].id
        } else {
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

        const { error: mediaError } = await supabase
            .from('media')
            .insert([
                {
                    name: form.name,
                    description: form.description,
                    creator_id: authorId,
                    type_id: form.type_id,
                    image_url: form.image_url,
                },
            ])

        if (mediaError) {
            setErrorMessage(mediaError.message)
        } else {
            setSuccessMessage('Media added successfully!')
            setForm({ name: '', description: '', author: '', type_id: '', image_url: '' })
        }

        setIsSubmitting(false)
    }

    return (
        <div className="max-w-5xl mx-auto py-4">
            <form onSubmit={handleSubmit} className="card md:card-side bg-base-200 shadow-xl overflow-hidden">
                <figure className="w-full md:w-1/3 bg-base-300 flex items-center justify-center p-16 md:p-0 min-h-[350px] border-b md:border-b-0 md:border-r border-base-content/10">
                    {form.image_url ? (
                        <img
                            src={form.image_url}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-center opacity-50 flex flex-col items-center gap-2">
                            <span className="text-6xl font-light">+</span>
                            <span className="font-medium tracking-wide uppercase text-sm">Add Cover Photo</span>
                        </div>
                    )}
                </figure>

                <div className="card-body md:w-2/3 p-6 md:p-8">
                    <h2 className="card-title text-2xl mb-6 font-bold">Add New Media</h2>

                    <div className="form-control w-full mb-4">
                        <input
                            name="name"
                            type="text"
                            className="input input-bordered w-full bg-base-100 focus:input-primary"
                            placeholder="Name..."
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-control w-full mb-4">
                        <textarea
                            name="description"
                            className="textarea textarea-bordered w-full bg-base-100 focus:textarea-primary min-h-[120px]"
                            placeholder="Description..."
                            value={form.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-control w-full mb-4">
                        <input
                            name="author"
                            type="text"
                            className="input input-bordered w-full bg-base-100 focus:input-primary"
                            placeholder="Author / Creator..."
                            value={form.author}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-control w-full mb-4">
                        <input
                            name="image_url"
                            type="url"
                            className="input input-bordered w-full bg-base-100 focus:input-primary"
                            placeholder="Image URL..."
                            value={form.image_url}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-control w-full mb-6">
                        <select
                            name="type_id"
                            className="select select-bordered w-full bg-base-100 focus:select-primary"
                            value={form.type_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="" disabled>Select a type...</option>
                            {types.map((t) => (
                                <option key={t.id} value={t.id}>{t.type}</option>
                            ))}
                        </select>
                    </div>

                    {errorMessage && (
                        <div className="alert alert-error shadow-sm mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="alert alert-success shadow-sm mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{successMessage}</span>
                        </div>
                    )}

                    <div className="card-actions justify-end mt-auto pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary w-full sm:w-auto px-8"
                        >
                            {isSubmitting ? (
                                <><span className="loading loading-spinner loading-sm"></span> Submitting...</>
                            ) : (
                                'Create Media'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
