import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webcontainer'


function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)

            // hljs won't reprocess the element unless this attribute is removed
            ref.current.removeAttribute('data-highlighted')
        }
    }, [ props.className, props.children ])

    return <code {...props} ref={ref} />
}


const Project = () => {

    const location = useLocation()

    const [ isSidePanelOpen, setIsSidePanelOpen ] = useState(false)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ selectedUserId, setSelectedUserId ] = useState(new Set()) // Initialized as Set
    const [ project, setProject ] = useState(location.state.project)
    const [ message, setMessage ] = useState('')
    const { user } = useContext(UserContext)
    const messageBox = React.createRef()

    const [ users, setUsers ] = useState([])
    const [ messages, setMessages ] = useState([]) // New state variable for messages
    const [ fileTree, setFileTree ] = useState({})

    const [ currentFile, setCurrentFile ] = useState(null)
    const [ openFiles, setOpenFiles ] = useState([])

    const [ webContainer, setWebContainer ] = useState(null)
    const [ iframeUrl, setIframeUrl ] = useState(null)

    const [ runProcess, setRunProcess ] = useState(null)

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }

            return newSelectedUserId;
        });


    }


    function addCollaborators() {

        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false)

        }).catch(err => {
            console.log(err)
        })

    }

    const send = () => {

        sendMessage('project-message', {
            message,
            sender: user
        })
        setMessages(prevMessages => [ ...prevMessages, { sender: user, message } ]) // Update messages state
        setMessage("")

    }

    function WriteAiMessage(message) {

        const messageObject = JSON.parse(message)

        return (
            <div
                className='overflow-auto bg-slate-900/90 backdrop-blur-sm text-slate-100 rounded-xl p-4 border border-slate-700/50'
            >
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>)
    }

    useEffect(() => {

        initializeSocket(project._id)

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)
                console.log("container started")
            })
        }


        receiveMessage('project-message', data => {

            console.log(data)
            
            if (data.sender._id == 'ai') {


                const message = JSON.parse(data.message)

                console.log(message)

                webContainer?.mount(message.fileTree)

                if (message.fileTree) {
                    setFileTree(message.fileTree || {})
                }
                setMessages(prevMessages => [ ...prevMessages, data ]) // Update messages state
            } else {


                setMessages(prevMessages => [ ...prevMessages, data ]) // Update messages state
            }
        })


        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {

            console.log(res.data.project)

            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
        })

        axios.get('/users/all').then(res => {

            setUsers(res.data.users)

        }).catch(err => {

            console.log(err)

        })

    }, [])

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }


    // Removed appendIncomingMessage and appendOutgoingMessage functions

    function scrollToBottom() {
        messageBox.current.scrollTop = messageBox.current.scrollHeight
    }

    return (
        <main className='h-screen w-screen flex bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900'>
            <section className="left relative flex flex-col h-screen min-w-96 bg-slate-800/70 backdrop-blur-sm border-r border-slate-700/50">
                <header className='flex justify-between items-center p-4 w-full bg-slate-800/90 backdrop-blur-md absolute z-10 top-0 border-b border-slate-700/50'>
                    <button className='flex gap-2 items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg' onClick={() => setIsModalOpen(true)}>
                        <i className="ri-add-fill"></i>
                        <p>Add collaborator</p>
                    </button>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-all duration-300 hover:scale-105'>
                        <i className="ri-group-fill text-lg"></i>
                    </button>
                </header>
                <div className="conversation-area pt-20 pb-16 flex-grow flex flex-col h-full relative">

                    <div
                        ref={messageBox}
                        className="message-box p-4 flex-grow flex flex-col gap-3 overflow-auto max-h-full scrollbar-hide">
                        {messages.map((msg, index) => (
                            <div key={index} className={`${msg.sender._id === 'ai' ? 'max-w-80' : 'max-w-72'} ${msg.sender._id == user._id.toString() && 'ml-auto'}  message flex flex-col p-4 bg-slate-700/60 backdrop-blur-sm border border-slate-600/50 w-fit rounded-2xl transition-all duration-300 hover:bg-slate-700/80`}>
                                <small className='text-slate-300 text-xs font-medium mb-1'>{msg.sender.email}</small>
                                <div className='text-sm text-white'>
                                    {msg.sender._id === 'ai' ?
                                        WriteAiMessage(msg.message)
                                        : <p>{msg.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="inputField w-full flex absolute bottom-0 p-4 bg-slate-800/90 backdrop-blur-md border-t border-slate-700/50">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className='p-4 border-2 border-slate-600 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none transition-colors duration-300 bg-slate-700/50 hover:bg-slate-700/70 focus:bg-slate-700 text-white placeholder-slate-400 flex-grow mr-3' 
                            type="text" 
                            placeholder='Enter message...' 
                        />
                        <button
                            onClick={send}
                            className='px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg'>
                            <i className="ri-send-plane-fill text-lg"></i>
                        </button>
                    </div>
                </div>
                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-800/95 backdrop-blur-md absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0 border border-slate-700/50`}>
                    <header className='flex justify-between items-center px-4 p-4 bg-slate-700/60 backdrop-blur-sm border-b border-slate-600/50'>

                        <h1
                            className='font-bold text-xl text-white'
                        >Collaborators</h1>

                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-xl transition-all duration-300'>
                            <i className="ri-close-fill text-lg"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-3 p-4">

                        {project.users && project.users.map((collaborator, index) => {


                            return (
                                <div key={index} className="user cursor-pointer hover:bg-slate-700/60 p-3 flex gap-3 items-center rounded-xl transition-all duration-300 border border-slate-600/30">
                                    <div className='aspect-square rounded-2xl w-12 h-12 flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'>
                                        <i className="ri-user-fill text-lg"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg text-white'>{collaborator.email}</h1>
                                </div>
                            )


                        })}
                    </div>
                </div>
            </section>

            <section className="right bg-slate-900/50 backdrop-blur-sm flex-grow h-full flex border-l border-slate-700/50">

                <div className="explorer h-full max-w-64 min-w-52 bg-slate-800/60 backdrop-blur-sm border-r border-slate-700/50">
                    <div className="file-tree w-full">
                        <div className="p-4 border-b border-slate-700/50">
                            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                                <i className="ri-folder-line text-blue-400"></i>
                                Files
                            </h3>
                        </div>
                        {
                            Object.keys(fileTree).map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setCurrentFile(file)
                                        setOpenFiles([ ...new Set([ ...openFiles, file ]) ])
                                    }}
                                    className="tree-element cursor-pointer p-3 px-4 flex items-center gap-3 bg-slate-800/40 hover:bg-slate-700/60 w-full transition-all duration-300 border-b border-slate-700/30 text-left">
                                    <i className="ri-file-code-line text-slate-400"></i>
                                    <p className='font-medium text-slate-200 hover:text-white transition-colors duration-300'>{file}</p>
                                </button>))

                        }
                    </div>

                </div>


                <div className="code-editor flex flex-col flex-grow h-full shrink bg-slate-900/30">

                    <div className="top flex justify-between w-full bg-slate-800/60 backdrop-blur-sm border-b border-slate-700/50 p-2">

                        <div className="files flex">
                            {
                                openFiles.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentFile(file)}
                                        className={`open-file cursor-pointer p-3 px-4 flex items-center w-fit gap-2 transition-all duration-300 rounded-t-xl ${currentFile === file ? 'bg-slate-700/80 text-white border-b-2 border-blue-500' : 'bg-slate-800/40 text-slate-300 hover:bg-slate-700/60 hover:text-white'}`}>
                                        <i className="ri-file-code-line text-sm"></i>
                                        <p className='font-medium'>{file}</p>
                                    </button>
                                ))
                            }
                        </div>

                        <div className="actions flex gap-2">
                            <button
                                onClick={async () => {
                                    await webContainer.mount(fileTree)


                                    const installProcess = await webContainer.spawn("npm", [ "install" ])



                                    installProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                                        }
                                    }))

                                    if (runProcess) {
                                        runProcess.kill()
                                    }

                                    let tempRunProcess = await webContainer.spawn("npm", [ "start" ]);

                                    tempRunProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                                        }
                                    }))

                                    setRunProcess(tempRunProcess)

                                    webContainer.on('server-ready', (port, url) => {
                                        console.log(port, url)
                                        setIframeUrl(url)
                                    })

                                }}
                                className='p-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2'
                            >
                                <i className="ri-play-fill"></i>
                                Run
                            </button>


                        </div>
                    </div>
                    <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
                        {
                            fileTree[ currentFile ] && (
                                <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-900/80 backdrop-blur-sm">
                                    <pre
                                        className="hljs h-full bg-slate-900/50">
                                        <code
                                            className="hljs h-full outline-none text-slate-100"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const updatedContent = e.target.innerText;
                                                const ft = {
                                                    ...fileTree,
                                                    [ currentFile ]: {
                                                        file: {
                                                            contents: updatedContent
                                                        }
                                                    }
                                                }
                                                setFileTree(ft)
                                                saveFileTree(ft)
                                            }}
                                            dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', fileTree[ currentFile ].file.contents).value }}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                paddingBottom: '25rem',
                                                counterSet: 'line-numbering',
                                                padding: '1.5rem',
                                            }}
                                        />
                                    </pre>
                                </div>
                            )
                        }
                    </div>

                </div>

                {iframeUrl && webContainer &&
                    (<div className="flex min-w-96 flex-col h-full bg-slate-800/40 backdrop-blur-sm border-l border-slate-700/50">
                        <div className="address-bar bg-slate-800/60 backdrop-blur-sm border-b border-slate-700/50 p-3">
                            <input type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl} 
                                className="w-full p-3 border-2 border-slate-600 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors duration-300 bg-slate-700/50 hover:bg-slate-700/70 focus:bg-slate-700 text-white placeholder-slate-400" 
                                placeholder="URL..."
                            />
                        </div>
                        <iframe src={iframeUrl} className="w-full h-full bg-white"></iframe>
                    </div>)
                }


            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800/95 backdrop-blur-md rounded-3xl shadow-2xl w-96 max-w-full relative border border-slate-700/50">
                        <header className='flex justify-between items-center p-6 border-b border-slate-700/50'>
                            <h2 className='text-2xl font-bold text-white'>Select Users</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-all duration-300'>
                                <i className="ri-close-fill text-lg"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-3 p-6 mb-16 max-h-96 overflow-auto">
                            {users.map(user => (
                                <div key={user._id} className={`user cursor-pointer hover:bg-slate-700/60 ${Array.from(selectedUserId).indexOf(user._id) != -1 ? 'bg-slate-700/80 border-blue-500' : "bg-slate-800/40 border-slate-600/50"} p-3 flex gap-3 items-center rounded-xl transition-all duration-300 border-2`} onClick={() => handleUserClick(user._id)}>
                                    <div className='aspect-square relative rounded-2xl w-12 h-12 flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'>
                                        <i className="ri-user-fill text-lg"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg text-white'>{user.email}</h1>
                                    {Array.from(selectedUserId).indexOf(user._id) != -1 && (
                                        <i className="ri-check-fill text-green-400 ml-auto text-lg"></i>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='absolute bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project