import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    signInAnonymously,
    signInWithCustomToken
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    addDoc, 
    doc, 
    setDoc, 
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp
} from 'firebase/firestore';
import { 
    getStorage, 
    ref, 
    uploadBytesResumable, 
    getDownloadURL 
} from 'firebase/storage';
import { 
    Home, 
    ClipboardList, 
    History, 
    Settings, 
    LogOut, 
    ChevronDown, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Plus, 
    Trash2, 
    Edit, 
    Users, 
    Camera, 
    Filter, 
    X, 
    UploadCloud,
    Printer
} from 'lucide-react';
import { firebaseConfig as importedConfig, appId as importedAppId } from './firebase.config';

// --- Configuração do Firebase ---
// Prioriza variáveis de ambiente (para CI/CD) ou usa o arquivo de configuração
const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config !== '{}' 
  ? JSON.parse(__firebase_config) 
  : importedConfig;
const appId = typeof __app_id !== 'undefined' && __app_id !== 'default-app-id' 
  ? __app_id 
  : importedAppId;

// --- Inicialização dos Serviços do Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Hooks Personalizados ---
const useUserData = (user) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setUserData(null);
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, `/artifacts/${appId}/users`, user.uid);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setUserData({ uid: doc.id, ...doc.data() });
            } else {
                setUserData(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar dados do usuário:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { userData, loading };
};

// --- Componentes Reutilizáveis ---
const Spinner = () => (
    <div className="flex justify-center items-center h-full w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
);

const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
        {children}
    </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }) => {
    const baseClasses = "px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };
    const disabledClasses = "disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500";
    return (
        <button type={type} onClick={onClick} className={`${baseClasses} ${variants[variant]} ${className} ${disabledClasses}`} disabled={disabled}>
            {children}
        </button>
    );
};

const Input = ({ type = 'text', value, onChange, placeholder, className = "" }) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-auto">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Páginas da Aplicação ---

const LoginPage = ({ setPage }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nome, setNome] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                if(!nome) {
                    setError("O nome é obrigatório para o cadastro.");
                    setLoading(false);
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await setDoc(doc(db, `/artifacts/${appId}/users`, user.uid), {
                    nome: nome,
                    email: user.email,
                    tipo: 'tecnico'
                });
            }
        } catch (err) {
            setError(err.message.includes("auth/invalid-credential") ? "E-mail ou senha inválidos." : "Ocorreu um erro. Tente novamente.");
            console.error("Erro de autenticação:", err);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-600">Rotinas TI HPAES</h1>
                    <p className="text-gray-600 mt-2">{isLogin ? 'Acesse sua conta' : 'Crie uma nova conta'}</p>
                </div>
                <Card>
                    <form onSubmit={handleAuth}>
                        {!isLogin && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <Input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="********" />
                        </div>
                        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Spinner/> : (isLogin ? 'Entrar' : 'Cadastrar')}
                        </Button>
                    </form>
                    <p className="text-center text-sm text-gray-600 mt-6">
                        {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                        <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-semibold text-blue-600 hover:text-blue-700 ml-1">
                            {isLogin ? 'Cadastre-se' : 'Faça login'}
                        </button>
                    </p>
                </Card>
            </div>
        </div>
    );
};

// --- Componentes do Dashboard ---
const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <Card className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </Card>
);

const ProgressCircle = ({ percentage }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
                <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="64" cy="64" />
                <circle
                    className="text-blue-600"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="64"
                    cy="64"
                />
            </svg>
            <span className="absolute text-2xl font-bold text-blue-700">{`${Math.round(percentage)}%`}</span>
            <p className="mt-2 text-sm text-gray-600 font-semibold">Concluído Hoje</p>
        </div>
    );
};

const DashboardPage = ({ routines, executions, setPage }) => {
    const { pendingToday, completedToday, overdue } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startOfToday = Timestamp.fromDate(today);

        const dailyRoutines = routines.filter(r => r.frequencia === 'diaria');
        
        const completedTodayIds = new Set(
            executions
                .filter(e => e.dataHora >= startOfToday)
                .map(e => e.rotinaId)
        );

        let pendingToday = [];
        let completedToday = [];
        let overdue = [];

        dailyRoutines.forEach(routine => {
            if(completedTodayIds.has(routine.id)) {
                completedToday.push(routine);
            } else {
                pendingToday.push(routine);
            }
        });
        
        return { pendingToday, completedToday, overdue };
    }, [routines, executions]);

    const totalToday = pendingToday.length + completedToday.length;
    const completionPercentage = totalToday > 0 ? (completedToday.length / totalToday) * 100 : 100;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="md:col-span-2 lg:col-span-2 flex flex-col sm:flex-row items-center justify-around">
                    <ProgressCircle percentage={completionPercentage} />
                    <div className="text-center sm:text-left mt-4 sm:mt-0">
                        <h3 className="text-lg font-semibold text-gray-800">Resumo do Dia</h3>
                        <p className="text-gray-600">{`Você concluiu ${completedToday.length} de ${totalToday} rotinas diárias.`}</p>
                        <Button onClick={() => setPage('rotinas')} className="mt-4">
                            Ver Rotinas
                        </Button>
                    </div>
                </Card>
                <StatCard title="Pendentes Hoje" value={pendingToday.length} icon={Clock} colorClass="bg-yellow-500" />
                <StatCard title="Concluídas Hoje" value={completedToday.length} icon={CheckCircle} colorClass="bg-green-500" />
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Rotinas Pendentes para Hoje</h3>
                {pendingToday.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {pendingToday.map(routine => (
                           <Card key={routine.id} className="flex justify-between items-center">
                               <div>
                                   <p className="font-semibold">{routine.nome}</p>
                                   <p className="text-sm text-gray-500">{routine.categoria}</p>
                               </div>
                               <button onClick={() => setPage('rotinas')} className="text-blue-600 hover:underline text-sm font-semibold">
                                   Executar
                               </button>
                           </Card>
                       ))}
                    </div>
                ) : (
                    <Card>
                        <p className="text-center text-gray-600">🎉 Todas as rotinas diárias foram concluídas!</p>
                    </Card>
                )}
            </div>
        </div>
    );
};

const RoutinesPage = ({ routines, executions, userData }) => {
    const [filter, setFilter] = useState('Todas');
    const [executingRoutine, setExecutingRoutine] = useState(null);
    const [observacao, setObservacao] = useState('');
    const [foto, setFoto] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFoto(e.target.files[0]);
        }
    };

    const closeAndResetModal = () => {
        setExecutingRoutine(null);
        setObservacao('');
        setFoto(null);
        setUploadProgress(0);
        setIsSubmitting(false);
    };

    const handleSubmitExecution = async () => {
        if (!executingRoutine || isSubmitting) return;
        setIsSubmitting(true);

        const executionData = {
            rotinaId: executingRoutine.id,
            dataHora: Timestamp.now(),
            responsavelId: userData.uid,
            responsavelNome: userData.nome,
            observacao: observacao,
            fotoUrl: ''
        };

        if (foto) {
            const storageRef = ref(storage, `evidencias/${appId}/${executingRoutine.id}_${Date.now()}`);
            const uploadTask = uploadBytesResumable(storageRef, foto);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Erro no upload:", error);
                    alert("Falha ao enviar a foto.");
                    setIsSubmitting(false);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    executionData.fotoUrl = downloadURL;
                    await addDoc(collection(db, `/artifacts/${appId}/public/data/execucoes`), executionData);
                    closeAndResetModal();
                }
            );
        } else {
            await addDoc(collection(db, `/artifacts/${appId}/public/data/execucoes`), executionData);
            closeAndResetModal();
        }
    };

    const getRoutineStatus = useCallback((routine) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastExecution = executions
            .filter(e => e.rotinaId === routine.id)
            .sort((a, b) => b.dataHora.toMillis() - a.dataHora.toMillis())[0];

        if (!lastExecution) return { text: 'Pendente', color: 'text-yellow-600', isDone: false };

        const lastExecDate = lastExecution.dataHora.toDate();

        switch(routine.frequencia) {
            case 'diaria':
                if (lastExecDate >= today) {
                    return { text: 'Concluída Hoje', color: 'text-green-600', isDone: true };
                }
                break;
            case 'semanal':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                startOfWeek.setHours(0,0,0,0);
                if (lastExecDate >= startOfWeek) {
                     return { text: 'Concluída na Semana', color: 'text-green-600', isDone: true };
                }
                break;
            case 'mensal':
                 const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                 if (lastExecDate >= startOfMonth) {
                     return { text: 'Concluída no Mês', color: 'text-green-600', isDone: true };
                 }
                break;
            default:
                break;
        }

        return { text: 'Pendente', color: 'text-yellow-600', isDone: false };

    }, [executions]);

    const filteredRoutines = useMemo(() => {
        if (filter === 'Todas') return routines;
        return routines.filter(r => r.categoria === filter);
    }, [filter, routines]);

    const categories = ['Todas', ...new Set(routines.map(r => r.categoria))];

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Checklist de Rotinas</h2>
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-600 w-5 h-5" />
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-gray-300 rounded-lg p-2">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {filteredRoutines.map(routine => {
                    const status = getRoutineStatus(routine);
                    return (
                        <Card key={routine.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-800">{routine.nome}</h3>
                                <p className="text-sm text-gray-600 mt-1">{routine.descricao}</p>
                                <div className="flex items-center gap-4 text-sm mt-2 text-gray-500">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{routine.categoria}</span>
                                    <span className="capitalize">{routine.frequencia}</span>
                                    <span className={`font-semibold ${status.color}`}>{status.text}</span>
                                </div>
                            </div>
                            <Button 
                                onClick={() => setExecutingRoutine(routine)} 
                                disabled={status.isDone}
                                className="w-full sm:w-auto"
                            >
                                {status.isDone ? <CheckCircle className="w-5 h-5"/> : <ClipboardList className="w-5 h-5"/>}
                                {status.isDone ? 'Concluída' : 'Marcar como Concluída'}
                            </Button>
                        </Card>
                    );
                })}
            </div>

            <Modal isOpen={!!executingRoutine} onClose={closeAndResetModal} title={`Executar: ${executingRoutine?.nome}`}>
                 <div className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                         <textarea 
                             value={observacao} 
                             onChange={e => setObservacao(e.target.value)}
                             rows="3"
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="Algum problema encontrado? Detalhes da execução..."
                         ></textarea>
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Evidência (Foto)</label>
                         <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                             <div className="space-y-1 text-center">
                                 <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                 <div className="flex text-sm text-gray-600">
                                     <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                         <span>Selecione um arquivo</span>
                                         <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                                     </label>
                                     <p className="pl-1">ou arraste e solte</p>
                                 </div>
                                 <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                                 {foto && <p className="text-sm text-green-600 mt-2">{foto.name}</p>}
                             </div>
                         </div>
                     </div>
                     {isSubmitting && uploadProgress > 0 && (
                         <div className="w-full bg-gray-200 rounded-full h-2.5">
                             <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                         </div>
                     )}
                     <div className="flex justify-end gap-2 pt-4">
                         <Button variant="secondary" onClick={closeAndResetModal} disabled={isSubmitting}>Cancelar</Button>
                         <Button onClick={handleSubmitExecution} disabled={isSubmitting}>
                             {isSubmitting ? 'Salvando...' : 'Salvar Execução'}
                         </Button>
                     </div>
                 </div>
            </Modal>
        </div>
    );
};

const HistoryPage = ({ executions, routines }) => {
    const [filterDate, setFilterDate] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const routinesMap = useMemo(() => {
        return routines.reduce((acc, routine) => {
            acc[routine.id] = routine;
            return acc;
        }, {});
    }, [routines]);

    const usersList = useMemo(() => {
        return [...new Map(executions.map(item => [item.responsavelId, item.responsavelNome])).values()];
    }, [executions]);
    
    const categoriesList = useMemo(() => {
        return [...new Set(routines.map(r => r.categoria))];
    }, [routines]);

    const filteredExecutions = useMemo(() => {
        return executions
            .filter(exec => {
                const routine = routinesMap[exec.rotinaId];
                if (!routine) return false;

                const dateMatch = !filterDate || exec.dataHora.toDate().toISOString().startsWith(filterDate);
                const userMatch = !filterUser || exec.responsavelNome === filterUser;
                const categoryMatch = !filterCategory || routine.categoria === filterCategory;

                return dateMatch && userMatch && categoryMatch;
            })
            .sort((a, b) => b.dataHora.toMillis() - a.dataHora.toMillis());
    }, [executions, filterDate, filterUser, filterCategory, routinesMap]);

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Histórico de Execuções</h2>
            
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Data</label>
                        <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Técnico</label>
                        <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Todos</option>
                            {usersList.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Categoria</label>
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Todas</option>
                            {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            <div className="space-y-4">
                {filteredExecutions.length > 0 ? filteredExecutions.map(exec => {
                    const routine = routinesMap[exec.rotinaId];
                    if (!routine) return null;
                    return (
                        <Card key={exec.id}>
                            <div className="flex flex-col md:flex-row gap-4">
                                {exec.fotoUrl && (
                                    <div className="w-full md:w-32 h-32 flex-shrink-0">
                                      <a href={exec.fotoUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={exec.fotoUrl} alt="Evidência" className="w-full h-full object-cover rounded-lg" />
                                      </a>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{routine.nome}</h3>
                                    <p className="text-sm text-gray-500 mb-2">{routine.categoria}</p>
                                    <p className="text-gray-700 text-sm mb-3">"{exec.observacao || 'Nenhuma observação.'}"</p>
                                    <div className="text-xs text-gray-500">
                                        <p><strong>Executado por:</strong> {exec.responsavelNome}</p>
                                        <p><strong>Data:</strong> {exec.dataHora.toDate().toLocaleString('pt-BR')}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                }) : (
                    <Card>
                        <p className="text-center text-gray-600">Nenhum registro encontrado com os filtros aplicados.</p>
                    </Card>
                )}
            </div>
        </div>
    );
};

const PrintersPage = () => {
    const [printers, setPrinters] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPrinter, setCurrentPrinter] = useState(null);
    const [formState, setFormState] = useState({
        nome: '',
        modelo: '',
        localizacao: '',
        ip: '',
        status: 'ativa',
    });

    useEffect(() => {
        const printersRef = collection(db, `/artifacts/${appId}/public/data/impressoras`);
        const unsubscribe = onSnapshot(printersRef, (snapshot) => {
            setPrinters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, err => console.error("Erro ao carregar impressoras:", err));
        return () => unsubscribe();
    }, []);

    const openModalForNew = () => {
        setCurrentPrinter(null);
        setFormState({
            nome: '',
            modelo: '',
            localizacao: '',
            ip: '',
            status: 'ativa',
        });
        setIsModalOpen(true);
    };
    
    const openModalForEdit = (printer) => {
        setCurrentPrinter(printer);
        setFormState({
            nome: printer.nome,
            modelo: printer.modelo,
            localizacao: printer.localizacao,
            ip: printer.ip,
            status: printer.status,
        });
        setIsModalOpen(true);
    };
    
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async () => {
        if (!formState.nome || !formState.modelo) {
            alert("Nome e modelo são obrigatórios.");
            return;
        }

        try {
            if (currentPrinter) {
                const printerRef = doc(db, `/artifacts/${appId}/public/data/impressoras`, currentPrinter.id);
                await updateDoc(printerRef, formState);
            } else {
                await addDoc(collection(db, `/artifacts/${appId}/public/data/impressoras`), formState);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Erro ao salvar impressora:", error);
            alert("Ocorreu um erro ao salvar.");
        }
    };

    const handleDeletePrinter = async (printerId) => {
        if (window.confirm("Tem certeza que deseja excluir esta impressora? Esta ação não pode ser desfeita.")) {
            try {
                await deleteDoc(doc(db, `/artifacts/${appId}/public/data/impressoras`, printerId));
            } catch (error) {
                console.error("Erro ao excluir impressora:", error);
                alert("Falha ao excluir a impressora.");
            }
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Gerenciar Impressoras</h2>
                <Button onClick={openModalForNew}>
                    <Plus className="w-5 h-5"/>
                    Nova Impressora
                </Button>
            </div>
            
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Nome</th>
                                <th className="p-2">Modelo</th>
                                <th className="p-2">Localização</th>
                                <th className="p-2">IP</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {printers.map(printer => (
                                <tr key={printer.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2 font-medium">{printer.nome}</td>
                                    <td className="p-2">{printer.modelo}</td>
                                    <td className="p-2">{printer.localizacao}</td>
                                    <td className="p-2">{printer.ip}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            printer.status === 'ativa' ? 'bg-green-100 text-green-800' : 
                                            printer.status === 'manutencao' ? 'bg-yellow-100 text-yellow-800' : 
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {printer.status === 'ativa' ? 'Ativa' : 
                                             printer.status === 'manutencao' ? 'Manutenção' : 'Inativa'}
                                        </span>
                                    </td>
                                    <td className="p-2 flex gap-2">
                                        <button onClick={() => openModalForEdit(printer)} className="text-blue-600 hover:text-blue-800">
                                            <Edit className="w-5 h-5"/>
                                        </button>
                                        <button onClick={() => handleDeletePrinter(printer.id)} className="text-red-600 hover:text-red-800">
                                            <Trash2 className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {printers.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            Nenhuma impressora cadastrada. Clique em "Nova Impressora" para adicionar.
                        </div>
                    )}
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentPrinter ? 'Editar Impressora' : 'Nova Impressora'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <Input name="nome" value={formState.nome} onChange={handleFormChange} placeholder="Ex: Impressora Recepção" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                        <Input name="modelo" value={formState.modelo} onChange={handleFormChange} placeholder="Ex: HP LaserJet Pro M404" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                        <Input name="localizacao" value={formState.localizacao} onChange={handleFormChange} placeholder="Ex: Sala 101" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço IP</label>
                        <Input name="ip" value={formState.ip} onChange={handleFormChange} placeholder="Ex: 192.168.1.100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select name="status" value={formState.status} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="ativa">Ativa</option>
                            <option value="manutencao">Manutenção</option>
                            <option value="inativa">Inativa</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleFormSubmit}>Salvar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const AdminPage = ({ routines, users }) => {
    const [page, setPage] = useState('routines');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRoutine, setCurrentRoutine] = useState(null);
    const [formState, setFormState] = useState({
        nome: '',
        descricao: '',
        categoria: 'Rede',
        frequencia: 'diaria',
    });

    const openModalForNew = () => {
        setCurrentRoutine(null);
        setFormState({
            nome: '',
            descricao: '',
            categoria: 'Rede',
            frequencia: 'diaria',
        });
        setIsModalOpen(true);
    };
    
    const openModalForEdit = (routine) => {
        setCurrentRoutine(routine);
        setFormState({
            nome: routine.nome,
            descricao: routine.descricao,
            categoria: routine.categoria,
            frequencia: routine.frequencia,
        });
        setIsModalOpen(true);
    };
    
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async () => {
        if (!formState.nome || !formState.categoria) {
            alert("Nome e categoria são obrigatórios.");
            return;
        }

        try {
            if (currentRoutine) {
                const routineRef = doc(db, `/artifacts/${appId}/public/data/rotinas`, currentRoutine.id);
                await updateDoc(routineRef, formState);
            } else {
                await addDoc(collection(db, `/artifacts/${appId}/public/data/rotinas`), formState);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Erro ao salvar rotina:", error);
            alert("Ocorreu um erro ao salvar.");
        }
    };

    const handleDeleteRoutine = async (routineId) => {
        if (window.confirm("Tem certeza que deseja excluir esta rotina? Esta ação não pode ser desfeita.")) {
            try {
                await deleteDoc(doc(db, `/artifacts/${appId}/public/data/rotinas`, routineId));
            } catch (error) {
                console.error("Erro ao excluir rotina:", error);
                alert("Falha ao excluir a rotina.");
            }
        }
    };

    const handleUserRoleChange = async (user, newRole) => {
      if (window.confirm(`Tem certeza que deseja alterar o papel de ${user.nome} para ${newRole}?`)) {
          try {
              const userRef = doc(db, `/artifacts/${appId}/users`, user.uid);
              await updateDoc(userRef, { tipo: newRole });
          } catch (error) {
              console.error("Erro ao alterar papel do usuário:", error);
              alert("Falha ao alterar o papel.");
          }
      }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Administração</h2>

            <div className="flex border-b mb-6">
                <button onClick={() => setPage('routines')} className={`px-4 py-2 font-semibold ${page === 'routines' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                    Gerenciar Rotinas
                </button>
                <button onClick={() => setPage('users')} className={`px-4 py-2 font-semibold ${page === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                    Gerenciar Usuários
                </button>
            </div>

            {page === 'routines' && (
                <div>
                    <div className="flex justify-end mb-4">
                        <Button onClick={openModalForNew}>
                            <Plus className="w-5 h-5"/>
                            Nova Rotina
                        </Button>
                    </div>
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-2">Nome</th>
                                        <th className="p-2">Categoria</th>
                                        <th className="p-2">Frequência</th>
                                        <th className="p-2">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routines.map(routine => (
                                        <tr key={routine.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-medium">{routine.nome}</td>
                                            <td className="p-2">{routine.categoria}</td>
                                            <td className="p-2 capitalize">{routine.frequencia}</td>
                                            <td className="p-2 flex gap-2">
                                                <button onClick={() => openModalForEdit(routine)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5"/></button>
                                                <button onClick={() => handleDeleteRoutine(routine.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
            
            {page === 'users' && (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2">Nome</th>
                                    <th className="p-2">E-mail</th>
                                    <th className="p-2">Papel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.uid} className="border-b hover:bg-gray-50">
                                        <td className="p-2 font-medium">{user.nome}</td>
                                        <td className="p-2">{user.email}</td>
                                        <td className="p-2">
                                            <select 
                                                value={user.tipo}
                                                onChange={(e) => handleUserRoleChange(user, e.target.value)}
                                                className="border border-gray-300 rounded p-1"
                                            >
                                                <option value="tecnico">Técnico</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentRoutine ? 'Editar Rotina' : 'Nova Rotina'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <Input name="nome" value={formState.nome} onChange={handleFormChange} placeholder="Ex: Verificar Backup Servidor X" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea name="descricao" value={formState.descricao} onChange={handleFormChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Detalhes da tarefa..."></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        <select name="categoria" value={formState.categoria} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="Rede">Rede</option>
                            <option value="Computadores">Computadores</option>
                            <option value="Impressoras">Impressoras</option>
                            <option value="Backup">Backup</option>
                            <option value="Servidores">Servidores</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
                        <select name="frequencia" value={formState.frequencia} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="diaria">Diária</option>
                            <option value="semanal">Semanal</option>
                            <option value="mensal">Mensal</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleFormSubmit}>Salvar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// --- Componente Principal da Aplicação ---
export default function App() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const { userData, loading: userDataLoading } = useUserData(user);
    
    const [page, setPage] = useState('dashboard');
    const [routines, setRoutines] = useState([]);
    const [executions, setExecutions] = useState([]);
    const [users, setUsers] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    
    useEffect(() => {
      const performAuth = async () => {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Authentication Error:", error);
        }
      };
      performAuth();

      const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setAuthLoading(false);
      });
      return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user || !userData) {
          setDataLoading(false);
          setRoutines([]);
          setExecutions([]);
          if (userData && userData.tipo !== 'admin') {
            setUsers([]);
          }
          return;
        }

        setDataLoading(true);

        const routinesRef = collection(db, `/artifacts/${appId}/public/data/rotinas`);
        const unsubRoutines = onSnapshot(routinesRef, (snapshot) => {
            setRoutines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setDataLoading(false);
        }, err => {
            console.error("Erro em rotinas:", err);
            setDataLoading(false);
        });

        const executionsRef = collection(db, `/artifacts/${appId}/public/data/execucoes`);
        const unsubExecutions = onSnapshot(executionsRef, (snapshot) => {
            setExecutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, err => console.error("Erro em execuções:", err));
        
        let unsubUsers = () => {};
        if (userData.tipo === 'admin') {
            const usersRef = collection(db, `/artifacts/${appId}/users`);
            unsubUsers = onSnapshot(usersRef, (snapshot) => {
                setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
            }, err => console.error("Erro em usuários:", err));
        } else {
             setUsers([]);
        }

        return () => {
            unsubRoutines();
            unsubExecutions();
            unsubUsers();
        };
    }, [user, userData]);

    const handleSignOut = async () => {
        await signOut(auth);
        setPage('dashboard');
    };

    if (authLoading || userDataLoading) {
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><Spinner /></div>;
    }
    
    if (!user || !userData) {
        return <LoginPage setPage={setPage} />;
    }

    const renderPage = () => {
        if (dataLoading) {
            return <Spinner />;
        }
        switch (page) {
            case 'dashboard':
                return <DashboardPage routines={routines} executions={executions} setPage={setPage} />;
            case 'rotinas':
                return <RoutinesPage routines={routines} executions={executions} userData={userData} />;
            case 'historico':
                return <HistoryPage executions={executions} routines={routines} />;
            case 'impressoras':
                return <PrintersPage />;
            case 'admin':
                return userData.tipo === 'admin' ? <AdminPage routines={routines} users={users} /> : <p>Acesso negado.</p>;
            default:
                return <DashboardPage routines={routines} executions={executions} setPage={setPage} />;
        }
    };
    
    const navItems = [
        { name: 'Dashboard', icon: Home, page: 'dashboard' },
        { name: 'Rotinas', icon: ClipboardList, page: 'rotinas' },
        { name: 'Histórico', icon: History, page: 'historico' },
        { name: 'Impressoras', icon: Printer, page: 'impressoras' },
    ];
    
    if (userData && userData.tipo === 'admin') {
        navItems.push({ name: 'Admin', icon: Settings, page: 'admin' });
    }

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar para Desktop */}
            <aside className="hidden md:flex w-64 flex-col bg-white border-r">
                <div className="h-16 flex items-center justify-center border-b">
                    <h1 className="text-xl font-bold text-blue-600">Rotinas TI HPAES</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map(item => (
                         <button key={item.name} onClick={() => setPage(item.page)} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left ${page === item.page ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                             <item.icon className="w-6 h-6" />
                             {item.name}
                         </button>
                    ))}
                </nav>
                 <div className="p-4 border-t">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                            {userData.nome.charAt(0)}
                        </div>
                        <div>
                            <p className="font-semibold text-sm">{userData.nome}</p>
                            <p className="text-xs text-gray-500">{userData.email}</p>
                        </div>
                     </div>
                     <Button onClick={handleSignOut} variant="secondary" className="w-full">
                         <LogOut className="w-5 h-5"/>
                         Sair
                     </Button>
                 </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6 md:p-8">
                    {renderPage()}
                </main>
            </div>
            
             {/* Bottom Nav para Mobile */}
             <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg flex justify-around">
                {navItems.map(item => (
                    <button key={item.name} onClick={() => setPage(item.page)} className={`flex flex-col items-center justify-center p-2 w-full ${page === item.page ? 'text-blue-600' : 'text-gray-500'}`}>
                        <item.icon className="w-6 h-6" />
                        <span className="text-xs">{item.name}</span>
                    </button>
                ))}
                 <button onClick={handleSignOut} className="flex flex-col items-center justify-center p-2 w-full text-gray-500">
                     <LogOut className="w-6 h-6" />
                     <span className="text-xs">Sair</span>
                 </button>
             </nav>
        </div>
    );
}
