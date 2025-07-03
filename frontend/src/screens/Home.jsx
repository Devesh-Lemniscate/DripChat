import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'

const Home = () => {

    const { user } = useContext(UserContext)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ projectName, setProjectName ] = useState('')
    const [ project, setProject ] = useState([])
    const [ loading, setLoading ] = useState(false)
    const [ error, setError ] = useState('')

    const navigate = useNavigate()

    const fetchProjects = () => {
        axios.get('/projects/all').then((res) => {
            setProject(res.data.projects)
        }).catch(err => {
            console.log(err)
        })
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setProjectName('')
        setError('')
        setLoading(false)
    }

    function createProject(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (!projectName.trim()) {
            setError('Project name is required')
            setLoading(false)
            return
        }

        axios.post('/projects/create', {
            name: projectName.trim(),
        })
            .then((res) => {
                console.log(res)
                setIsModalOpen(false)
                setProjectName('')
                setError('')
                // Refresh the projects list
                fetchProjects()
            })
            .catch((error) => {
                console.log(error)
                if (error.response && error.response.data) {
                    setError(error.response.data.message || error.response.data || 'Failed to create project')
                } else {
                    setError('Failed to create project. Please try again.')
                }
            })
            .finally(() => {
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    return (
        <main className='min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 p-8'>
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                        Welcome back, {user?.email?.split('@')[0] || 'Developer'}
                    </h1>
                    <p className="text-slate-300 text-lg">Let&apos;s build something amazing together</p>
                </div>

                <div className="projects grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="group relative overflow-hidden bg-slate-800/60 backdrop-blur-sm border-2 border-dashed border-slate-600 rounded-2xl p-8 hover:border-blue-400 hover:bg-slate-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <i className="ri-add-line text-2xl text-white"></i>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">New Project</h3>
                            <p className="text-sm text-slate-300">Start your next masterpiece</p>
                        </div>
                    </button>

                    {
                        project.map((project, index) => (
                            <div key={project._id}
                                onClick={() => {
                                    navigate(`/project`, {
                                        state: { project }
                                    })
                                }}
                                className="group relative overflow-hidden bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 cursor-pointer hover:bg-slate-800/90 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-2 hover:border-slate-600"
                                style={{
                                    animationDelay: `${index * 100}ms`
                                }}>
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center group-hover:from-blue-600/20 group-hover:to-purple-600/20 transition-colors duration-300 border border-slate-600">
                                            <i className="ri-folder-line text-xl text-slate-300 group-hover:text-blue-400 transition-colors duration-300"></i>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <i className="ri-arrow-right-up-line text-slate-500 text-lg"></i>
                                        </div>
                                    </div>
                                    
                                    <h2 className='text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300 line-clamp-2'>
                                        {project.name}
                                    </h2>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <div className="flex items-center gap-1">
                                                <i className="ri-team-line text-sm"></i>
                                                <span className="text-sm font-medium">{project.users.length}</span>
                                            </div>
                                            <span className="text-xs">collaborators</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-xs text-slate-400">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
                    <div className="bg-slate-800/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 border border-slate-700/50">
                        <div className="p-8">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <i className="ri-folder-add-line text-2xl text-white"></i>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Create New Project</h2>
                                <p className="text-slate-300">Start building your next amazing project</p>
                            </div>
                            
                            <form onSubmit={createProject} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-200 mb-3">Project Name</label>
                                    <input
                                        onChange={(e) => setProjectName(e.target.value)}
                                        value={projectName}
                                        type="text" 
                                        className="w-full p-4 border-2 border-slate-600 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none transition-colors duration-300 bg-slate-700/50 hover:bg-slate-700/70 focus:bg-slate-700 text-white placeholder-slate-400" 
                                        placeholder="Enter project name..."
                                        required 
                                        disabled={loading}
                                    />
                                    {error && (
                                        <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                                            <i className="ri-error-warning-line"></i>
                                            {error}
                                        </p>
                                    )}
                                </div>
                                
                                <div className="flex gap-3 pt-4">
                                    <button 
                                        type="button" 
                                        className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
                                        onClick={closeModal}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Creating...
                                            </div>
                                        ) : (
                                            'Create'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}


        </main>
    )
}

export default Home