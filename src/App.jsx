import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import logoImage from './assets/hpaes.png';
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
    getDocs,
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
    Printer,
    AlertTriangle,
    TrendingUp,
    Calendar,
    FileText,
    Download,
    Bell,
    AlertCircle,
    Search,
    Droplet,
    BarChart3,
    PieChart,
    Activity,
    Image,
    FileText as FileTextIcon,
    Paperclip,
    Eye,
    Award,
    TrendingDown,
    Shield,
    UserCheck,
    UserCog,
    List,
    Lock,
    BellRing,
    CalendarClock,
    FileCheck,
    Send,
    AlertOctagon,
    CheckSquare,
    GitBranch,
    Package,
    PackagePlus,
    PackageMinus,
    PackageSearch,
    TrendingDown as StockDown,
    Archive,
    Boxes
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

// --- Funções de Permissões ---
const ROLES = {
    ADMIN: 'admin',
    TECNICO: 'tecnico',
    ESTAGIARIO: 'estagiario'
};

const PERMISSIONS = {
    [ROLES.ADMIN]: {
        canManageUsers: true,
        canManageRoutines: true,
        canManagePrinters: true,
        canExecuteRoutines: true,
        canViewReports: true,
        canViewLogs: true,
        canAssignRoutines: true
    },
    [ROLES.TECNICO]: {
        canManageUsers: false,
        canManageRoutines: false,
        canManagePrinters: false,
        canExecuteRoutines: true,
        canViewReports: true,
        canViewLogs: false,
        canAssignRoutines: false
    },
    [ROLES.ESTAGIARIO]: {
        canManageUsers: false,
        canManageRoutines: false,
        canManagePrinters: false,
        canExecuteRoutines: true,
        canViewReports: false,
        canViewLogs: false,
        canAssignRoutines: false
    }
};

const hasPermission = (userRole, permission) => {
    return PERMISSIONS[userRole]?.[permission] || false;
};

// --- Funções de Log de Atividades ---
const logActivity = async (userId, userName, action, details = {}) => {
    try {
        await addDoc(collection(db, `/artifacts/${appId}/activityLogs`), {
            userId,
            userName,
            action,
            details,
            timestamp: Timestamp.now(),
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro ao registrar log:', error);
    }
};

// --- Funções de Agendamento e Notificações ---
const createNotification = async (userId, userName, type, message, routineId = null, priority = 'normal') => {
    try {
        await addDoc(collection(db, `/artifacts/${appId}/notifications`), {
            userId,
            userName,
            type, // 'routine_pending', 'routine_overdue', 'routine_assigned', 'system'
            message,
            routineId,
            priority, // 'low', 'normal', 'high', 'urgent'
            read: false,
            timestamp: Timestamp.now(),
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro ao criar notificação:', error);
    }
};

const scheduleNextExecution = async (routine, lastExecution) => {
    try {
        const nextDate = new Date();
        
        switch(routine.frequencia) {
            case 'diaria':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'semanal':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'mensal':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
        }
        
        // Criar agendamento
        await addDoc(collection(db, `/artifacts/${appId}/scheduledRoutines`), {
            routineId: routine.id,
            routineName: routine.nome,
            scheduledFor: Timestamp.fromDate(nextDate),
            status: 'pending', // 'pending', 'completed', 'overdue'
            assignedTechnicians: routine.assignedTechnicians || [],
            createdAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Erro ao agendar próxima execução:', error);
    }
};

const checkOverdueRoutines = async (routines, executions, users) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const routine of routines) {
        const lastExecution = executions
            .filter(e => e.rotinaId === routine.id)
            .sort((a, b) => b.dataHora.toMillis() - a.dataHora.toMillis())[0];
        
        let isOverdue = false;
        
        if (!lastExecution) {
            isOverdue = true;
        } else {
            const lastExecDate = lastExecution.dataHora.toDate();
            
            switch(routine.frequencia) {
                case 'diaria':
                    isOverdue = lastExecDate < today;
                    break;
                case 'semanal':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    isOverdue = lastExecDate < weekAgo;
                    break;
                case 'mensal':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    isOverdue = lastExecDate < monthAgo;
                    break;
            }
        }
        
        if (isOverdue) {
            // Notificar técnicos atribuídos ou todos
            const targetUsers = routine.assignedTechnicians && routine.assignedTechnicians.length > 0
                ? users.filter(u => routine.assignedTechnicians.includes(u.uid))
                : users.filter(u => u.tipo !== 'admin');
            
            for (const user of targetUsers) {
                await createNotification(
                    user.uid,
                    user.nome,
                    'routine_overdue',
                    `A rotina "${routine.nome}" está atrasada!`,
                    routine.id,
                    routine.prioridade === 'alta' ? 'urgent' : 'high'
                );
            }
        }
    }
};

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

    }, [user]);

    return { userData, loading };
};

const useNotifications = (userId) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        const notificationsRef = collection(db, `/artifacts/${appId}/notifications`);
        const q = query(notificationsRef, where('userId', '==', userId));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
            
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, [userId]);

    const markAsRead = async (notificationId) => {
        try {
            await updateDoc(doc(db, `/artifacts/${appId}/notifications`, notificationId), {
                read: true
            });
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadNotifs = notifications.filter(n => !n.read);
            for (const notif of unreadNotifs) {
                await updateDoc(doc(db, `/artifacts/${appId}/notifications`, notif.id), {
                    read: true
                });
            }
        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error);
        }
    };

    return { notifications, unreadCount, markAsRead, markAllAsRead };
};

// --- Componentes Básicos ---
const Logo = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'h-8',
        md: 'h-12',
        lg: 'h-16'
    };
    
    return (
        <img 
            src={logoImage} 
            alt="HPAES Logo" 
            className={`${sizes[size]} object-contain ${className}`} 
        />
    );
};

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

const Input = ({ type = 'text', value, onChange, placeholder, className = "", name, onKeyPress }) => (
    <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
);

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-y-auto">
            <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} m-auto my-8`}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Componente de Painel de Notificações
const NotificationsPanel = ({ notifications, unreadCount, markAsRead, markAllAsRead, onClose }) => {
    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    const getTypeIcon = (type) => {
        switch(type) {
            case 'routine_overdue': return <AlertOctagon className="w-5 h-5" />;
            case 'routine_pending': return <Clock className="w-5 h-5" />;
            case 'routine_assigned': return <CheckSquare className="w-5 h-5" />;
            case 'stock_low': return <Package className="w-5 h-5" />;
            default: return <BellRing className="w-5 h-5" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-md h-full shadow-xl flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">Notificações</h3>
                        {unreadCount > 0 && (
                            <p className="text-sm text-gray-500">{unreadCount} não lida{unreadCount > 1 ? 's' : ''}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Marcar todas como lidas
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {notifications.length > 0 ? notifications.map(notif => (
                        <div
                            key={notif.id}
                            className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all ${
                                notif.read ? 'bg-gray-50 border-gray-300' : getPriorityColor(notif.priority)
                            }`}
                            onClick={() => !notif.read && markAsRead(notif.id)}
                        >
                            <div className="flex items-start gap-3">
                                <div className={notif.read ? 'text-gray-400' : ''}>
                                    {getTypeIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-gray-800 font-semibold'}`}>
                                        {notif.message}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {notif.timestamp?.toDate().toLocaleString('pt-BR')}
                                    </p>
                                </div>
                                {!notif.read && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 text-gray-500">
                            <BellRing className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Nenhuma notificação</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente de Gráfico de Barras Simples
const SimpleBarChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="space-y-3">
            {title && <h4 className="font-semibold text-gray-700">{title}</h4>}
            {data.map((item, index) => (
                <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-semibold text-gray-800">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(item.value / maxValue) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

// Componente de Gráfico de Pizza Simples
const SimplePieChart = ({ data, title }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>Sem dados para exibir</p>
            </div>
        );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];
    
    return (
        <div className="space-y-4">
            {title && <h4 className="font-semibold text-gray-700">{title}</h4>}
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-40 h-40">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        {data.map((item, index) => {
                            const percentage = (item.value / total) * 100;
                            const prevPercentages = data.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 100, 0);
                            const strokeDasharray = `${percentage} ${100 - percentage}`;
                            const strokeDashoffset = -prevPercentages;
                            
                            return (
                                <circle
                                    key={index}
                                    cx="50"
                                    cy="50"
                                    r="15.915"
                                    fill="transparent"
                                    stroke={colors[index % colors.length]}
                                    strokeWidth="31.831"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-opacity hover:opacity-80"
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800">{total}</div>
                            <div className="text-xs text-gray-500">Total</div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full text-xs">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                            <div 
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-gray-600 truncate">{item.label}</div>
                                <div className="font-semibold text-gray-800">
                                    {item.value} <span className="text-gray-500">({Math.round((item.value / total) * 100)}%)</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Componente de Notificações
const NotificationBell = ({ unreadCount, onClick }) => {
    return (
        <div className="relative">
            <button 
                onClick={onClick}
                className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
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
                
                // Verificar se é o primeiro usuário
                const usersRef = collection(db, `/artifacts/${appId}/users`);
                const usersSnapshot = await getDocs(usersRef);
                const isFirstUser = usersSnapshot.empty;
                
                await setDoc(doc(db, `/artifacts/${appId}/users`, user.uid), {
                    nome: nome,
                    email: user.email,
                    tipo: isFirstUser ? 'admin' : 'tecnico'
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
                    <div className="flex justify-center mb-4">
                        <Logo size="lg" />
                    </div>
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
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
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
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-700">{`${Math.round(percentage)}%`}</span>
                </div>
            </div>
            <p className="text-sm text-gray-600 font-semibold">Concluído Hoje</p>
        </div>
    );
};

const DashboardPage = ({ routines, executions, setPage, users }) => {
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfToday = Timestamp.fromDate(today);
        
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfWeekTimestamp = Timestamp.fromDate(startOfWeek);
        
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

        // Rotinas por frequência
        const dailyRoutines = routines.filter(r => r.frequencia === 'diaria');
        const weeklyRoutines = routines.filter(r => r.frequencia === 'semanal');
        const monthlyRoutines = routines.filter(r => r.frequencia === 'mensal');
        
        // Execuções por período
        const executionsToday = executions.filter(e => e.dataHora >= startOfToday);
        const executionsWeek = executions.filter(e => e.dataHora >= startOfWeekTimestamp);
        const executionsMonth = executions.filter(e => e.dataHora >= startOfMonthTimestamp);
        
        const completedTodayIds = new Set(executionsToday.map(e => e.rotinaId));
        const completedWeekIds = new Set(executionsWeek.map(e => e.rotinaId));
        const completedMonthIds = new Set(executionsMonth.map(e => e.rotinaId));

        // Pendentes e atrasadas
        let pendingToday = [];
        let completedToday = [];
        let overdueRoutines = [];

        dailyRoutines.forEach(routine => {
            if(completedTodayIds.has(routine.id)) {
                completedToday.push(routine);
            } else {
                pendingToday.push(routine);
                if(routine.prioridade === 'alta') {
                    overdueRoutines.push(routine);
                }
            }
        });
        
        // Rotinas por categoria
        const categoriesData = {};
        routines.forEach(r => {
            categoriesData[r.categoria] = (categoriesData[r.categoria] || 0) + 1;
        });
        
        // Execuções por categoria esta semana
        const categoryExecutions = {};
        executionsWeek.forEach(exec => {
            const routine = routines.find(r => r.id === exec.rotinaId);
            if(routine) {
                categoryExecutions[routine.categoria] = (categoryExecutions[routine.categoria] || 0) + 1;
            }
        });
        
        // Tempo médio de conclusão (simulado - em horas desde a última execução)
        const avgCompletionTime = executionsToday.length > 0 ? 
            Math.round(executionsToday.length * 0.5) : 0;

        return {
            pendingToday,
            completedToday,
            overdueRoutines,
            totalToday: dailyRoutines.length,
            totalWeek: weeklyRoutines.length,
            totalMonth: monthlyRoutines.length,
            completedWeek: weeklyRoutines.filter(r => completedWeekIds.has(r.id)).length,
            completedMonth: monthlyRoutines.filter(r => completedMonthIds.has(r.id)).length,
            categoriesData,
            categoryExecutions,
            avgCompletionTime,
            executionsToday: executionsToday.length,
            executionsWeek: executionsWeek.length,
            executionsMonth: executionsMonth.length
        };
    }, [routines, executions]);

    const completionPercentage = stats.totalToday > 0 ? 
        (stats.completedToday.length / stats.totalToday) * 100 : 100;

    const categoryChartData = Object.entries(stats.categoriesData).map(([label, value]) => ({
        label,
        value
    }));

    const weeklyExecutionsData = Object.entries(stats.categoryExecutions).map(([label, value]) => ({
        label,
        value
    }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            {/* Alertas de Rotinas Atrasadas */}
            {stats.overdueRoutines.length > 0 && (
                <Card className="bg-red-50 border-l-4 border-red-500">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-bold text-red-800">Atenção! Rotinas Críticas Pendentes</h3>
                            <p className="text-sm text-red-700 mt-1">
                                Você tem {stats.overdueRoutines.length} rotina(s) de alta prioridade pendente(s) hoje.
                            </p>
                            <div className="mt-2 space-y-1">
                                {stats.overdueRoutines.map(r => (
                                    <div key={r.id} className="text-sm text-red-600">• {r.nome}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="md:col-span-2 lg:col-span-2 flex flex-col sm:flex-row items-center justify-around">
                    <ProgressCircle percentage={completionPercentage} />
                    <div className="text-center sm:text-left mt-4 sm:mt-0">
                        <h3 className="text-lg font-semibold text-gray-800">Resumo do Dia</h3>
                        <p className="text-gray-600">{`Você concluiu ${stats.completedToday.length} de ${stats.totalToday} rotinas diárias.`}</p>
                        <Button onClick={() => setPage('rotinas')} className="mt-4">
                            Ver Rotinas
                        </Button>
                    </div>
                </Card>
                <StatCard title="Pendentes Hoje" value={stats.pendingToday.length} icon={Clock} colorClass="bg-yellow-500" />
                <StatCard title="Concluídas Hoje" value={stats.completedToday.length} icon={CheckCircle} colorClass="bg-green-500" />
            </div>

            {/* Estatísticas Semanais e Mensais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Execuções Esta Semana" 
                    value={stats.executionsWeek} 
                    icon={TrendingUp} 
                    colorClass="bg-blue-500" 
                />
                <StatCard 
                    title="Execuções Este Mês" 
                    value={stats.executionsMonth} 
                    icon={Activity} 
                    colorClass="bg-purple-500" 
                />
                <StatCard 
                    title="Tempo Médio (h)" 
                    value={stats.avgCompletionTime} 
                    icon={Clock} 
                    colorClass="bg-indigo-500" 
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <SimplePieChart 
                        data={categoryChartData} 
                        title="Rotinas por Categoria"
                    />
                </Card>
                <Card>
                    <SimpleBarChart 
                        data={weeklyExecutionsData.length > 0 ? weeklyExecutionsData : [{label: 'Nenhuma execução', value: 0}]} 
                        title="Execuções por Categoria (Esta Semana)"
                    />
                </Card>
            </div>

            {/* Rotinas Pendentes */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Rotinas Pendentes para Hoje</h3>
                {stats.pendingToday.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {stats.pendingToday.map(routine => (
                           <Card key={routine.id} className="hover:shadow-lg transition-shadow">
                               <div className="flex justify-between items-start mb-2">
                                   <div className="flex-1">
                                       <div className="flex items-center gap-2 mb-1">
                                           <p className="font-semibold">{routine.nome}</p>
                                           {routine.prioridade === 'alta' && (
                                               <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Alta</span>
                                           )}
                                       </div>
                                       <p className="text-sm text-gray-500">{routine.categoria}</p>
                                       {routine.responsavel && (
                                           <p className="text-xs text-gray-400 mt-1">Resp: {routine.responsavel}</p>
                                       )}
                                   </div>
                               </div>
                               <button 
                                   onClick={() => setPage('rotinas')} 
                                   className="w-full mt-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
                               >
                                   Executar Agora
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
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('Todas');
    const [statusFilter, setStatusFilter] = useState('Todas');
    const [executingRoutine, setExecutingRoutine] = useState(null);
    const [observacao, setObservacao] = useState('');
    const [foto, setFoto] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checklistProgress, setChecklistProgress] = useState({});

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
        setChecklistProgress({});
    };

    const toggleChecklistItem = (index) => {
        setChecklistProgress(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleSubmitExecution = async () => {
        if (!executingRoutine || isSubmitting) return;
        
        // Verificar se todos os itens do checklist foram marcados
        if (executingRoutine.checklist && executingRoutine.checklist.length > 0) {
            const allChecked = executingRoutine.checklist.every((_, index) => checklistProgress[index]);
            if (!allChecked) {
                alert("Por favor, complete todos os itens do checklist antes de finalizar.");
                return;
            }
        }
        
        setIsSubmitting(true);

        const executionData = {
            rotinaId: executingRoutine.id,
            dataHora: Timestamp.now(),
            responsavelId: userData.uid,
            responsavelNome: userData.nome,
            observacao: observacao,
            fotoUrl: '',
            checklistCompleted: executingRoutine.checklist || []
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
                    
                    // Registrar log de atividade
                    await logActivity(
                        userData.uid,
                        userData.nome,
                        'EXECUCAO_ROTINA',
                        {
                            rotinaId: executingRoutine.id,
                            rotinaNome: executingRoutine.nome,
                            comFoto: true
                        }
                    );
                    
                    // Agendar próxima execução automaticamente
                    await scheduleNextExecution(executingRoutine, executionData);
                    
                    closeAndResetModal();
                }
            );
        } else {
            await addDoc(collection(db, `/artifacts/${appId}/public/data/execucoes`), executionData);
            
            // Registrar log de atividade
            await logActivity(
                userData.uid,
                userData.nome,
                'EXECUCAO_ROTINA',
                {
                    rotinaId: executingRoutine.id,
                    rotinaNome: executingRoutine.nome,
                    comFoto: false
                }
            );
            
            // Agendar próxima execução automaticamente
            await scheduleNextExecution(executingRoutine, executionData);
            
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
        let filtered = routines;
        
        // Filtro por rotinas atribuídas (se não for admin)
        if (userData && userData.tipo !== 'admin') {
            filtered = filtered.filter(r => {
                // Se a rotina tem técnicos atribuídos, verifica se o usuário está na lista
                if (r.assignedTechnicians && r.assignedTechnicians.length > 0) {
                    return r.assignedTechnicians.includes(userData.uid);
                }
                // Se não tem técnicos atribuídos, todos podem ver
                return true;
            });
        }
        
        // Filtro por categoria
        if (filter !== 'Todas') {
            filtered = filtered.filter(r => r.categoria === filter);
        }
        
        // Filtro por prioridade
        if (priorityFilter !== 'Todas') {
            filtered = filtered.filter(r => r.prioridade === priorityFilter);
        }
        
        // Filtro por status
        if (statusFilter !== 'Todas') {
            filtered = filtered.filter(r => {
                const status = getRoutineStatus(r);
                if (statusFilter === 'Concluída') return status.isDone;
                if (statusFilter === 'Pendente') return !status.isDone;
                return true;
            });
        }
        
        // Busca por texto
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(r => 
                r.nome.toLowerCase().includes(term) ||
                (r.descricao && r.descricao.toLowerCase().includes(term)) ||
                (r.responsavel && r.responsavel.toLowerCase().includes(term))
            );
        }
        
        return filtered;
    }, [filter, priorityFilter, statusFilter, searchTerm, routines, getRoutineStatus, userData]);

    const categories = ['Todas', ...new Set(routines.map(r => r.categoria))];

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Checklist de Rotinas</h2>
                
                {/* Barra de Busca */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nome, descrição ou responsável..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Filtros */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="text-gray-600 w-5 h-5" />
                        <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    
                    <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="Todas">Todas Prioridades</option>
                        <option value="alta">🔴 Alta</option>
                        <option value="media">🟡 Média</option>
                        <option value="baixa">🟢 Baixa</option>
                    </select>
                    
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="Todas">Todos Status</option>
                        <option value="Concluída">✅ Concluída</option>
                        <option value="Pendente">⏳ Pendente</option>
                    </select>
                    
                    {(searchTerm || filter !== 'Todas' || priorityFilter !== 'Todas' || statusFilter !== 'Todas') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilter('Todas');
                                setPriorityFilter('Todas');
                                setStatusFilter('Todas');
                            }}
                            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>
                
                {/* Contador de Resultados */}
                <div className="mt-3 text-sm text-gray-600">
                    Mostrando <span className="font-semibold">{filteredRoutines.length}</span> de <span className="font-semibold">{routines.length}</span> rotinas
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

            <Modal isOpen={!!executingRoutine} onClose={closeAndResetModal} title={`Executar: ${executingRoutine?.nome}`} size="lg">
                 <div className="space-y-4">
                     {/* Checklist Interativo */}
                     {executingRoutine?.checklist && executingRoutine.checklist.length > 0 && (
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Checklist</label>
                             <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                 {executingRoutine.checklist.map((item, index) => (
                                     <div key={index} className="flex items-start gap-3 p-2 hover:bg-white rounded transition-colors">
                                         <input
                                             type="checkbox"
                                             id={`checklist-${index}`}
                                             checked={checklistProgress[index] || false}
                                             onChange={() => toggleChecklistItem(index)}
                                             className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                         />
                                         <label 
                                             htmlFor={`checklist-${index}`}
                                             className={`flex-1 cursor-pointer ${checklistProgress[index] ? 'line-through text-gray-400' : 'text-gray-700'}`}
                                         >
                                             {item}
                                         </label>
                                     </div>
                                 ))}
                                 <div className="mt-3 pt-3 border-t border-gray-200">
                                     <div className="flex items-center justify-between text-sm">
                                         <span className="text-gray-600">Progresso</span>
                                         <span className="font-semibold text-blue-600">
                                             {Object.values(checklistProgress).filter(Boolean).length} / {executingRoutine.checklist.length}
                                         </span>
                                     </div>
                                     <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                         <div 
                                             className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                             style={{ 
                                                 width: `${(Object.values(checklistProgress).filter(Boolean).length / executingRoutine.checklist.length) * 100}%` 
                                             }}
                                         />
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}

                     {/* Instruções */}
                     {executingRoutine?.instrucoes && (
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Instruções</label>
                             <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                 <p className="text-sm text-gray-700 whitespace-pre-wrap">{executingRoutine.instrucoes}</p>
                             </div>
                         </div>
                     )}

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
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterRoutine, setFilterRoutine] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

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

                const execDate = exec.dataHora.toDate();
                const dateMatch = !filterDate || execDate.toISOString().startsWith(filterDate);
                const dateEndMatch = !filterDateEnd || execDate <= new Date(filterDateEnd + 'T23:59:59');
                const userMatch = !filterUser || exec.responsavelNome === filterUser;
                const categoryMatch = !filterCategory || routine.categoria === filterCategory;
                const routineMatch = !filterRoutine || exec.rotinaId === filterRoutine;

                // Busca por texto
                const searchMatch = !searchTerm.trim() || (
                    routine.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    exec.responsavelNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (exec.observacao && exec.observacao.toLowerCase().includes(searchTerm.toLowerCase()))
                );

                return dateMatch && dateEndMatch && userMatch && categoryMatch && routineMatch && searchMatch;
            })
            .sort((a, b) => b.dataHora.toMillis() - a.dataHora.toMillis());
    }, [executions, filterDate, filterDateEnd, filterUser, filterCategory, filterRoutine, searchTerm, routinesMap]);

    const exportToCSV = () => {
        const headers = ['Data/Hora', 'Rotina', 'Categoria', 'Responsável', 'Observação'];
        const rows = filteredExecutions.map(exec => {
            const routine = routinesMap[exec.rotinaId];
            return [
                exec.dataHora.toDate().toLocaleString('pt-BR'),
                routine?.nome || 'N/A',
                routine?.categoria || 'N/A',
                exec.responsavelNome,
                exec.observacao || ''
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_rotinas_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const clearFilters = () => {
        setFilterDate('');
        setFilterDateEnd('');
        setFilterUser('');
        setFilterCategory('');
        setFilterRoutine('');
        setSearchTerm('');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Histórico de Execuções</h2>
                <Button onClick={exportToCSV} variant="secondary">
                    <Download className="w-5 h-5" />
                    Exportar CSV
                </Button>
            </div>
            
            <Card className="mb-6">
                <div className="space-y-4">
                    {/* Barra de Busca */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar por rotina, técnico ou observação..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                            <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                            <Input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Rotina</label>
                            <select value={filterRoutine} onChange={e => setFilterRoutine(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">Todas</option>
                                {routines.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={clearFilters} variant="secondary" className="w-full">
                                <X className="w-4 h-4" />
                                Limpar Filtros
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                        <span className="text-sm text-gray-600">
                            Mostrando <strong>{filteredExecutions.length}</strong> de <strong>{executions.length}</strong> registros
                        </span>
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
                                    <div className="w-full md:w-32 h-32 flex-shrink-0 relative group">
                                        <img 
                                            src={exec.fotoUrl} 
                                            alt="Evidência" 
                                            className="w-full h-full object-cover rounded-lg cursor-pointer"
                                            onClick={() => setSelectedImage(exec.fotoUrl)}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                                            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="absolute top-1 right-1 bg-blue-500 text-white p-1 rounded-full">
                                            <Image className="w-3 h-3" />
                                        </div>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-bold text-lg">{routine.nome}</h3>
                                            <p className="text-sm text-gray-500 mb-2">{routine.categoria}</p>
                                        </div>
                                        {exec.fotoUrl && (
                                            <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                                <Paperclip className="w-3 h-3" />
                                                Anexo
                                            </span>
                                        )}
                                    </div>
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

            {/* Modal de Visualização de Imagem */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-full">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <img 
                            src={selectedImage} 
                            alt="Evidência ampliada" 
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <a
                            href={selectedImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Download className="w-4 h-4" />
                            Abrir Original
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

const PrintersPage = () => {
    const [printers, setPrinters] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPrinter, setCurrentPrinter] = useState(null);
    const [expandedPrinter, setExpandedPrinter] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todas');
    const [inkFilter, setInkFilter] = useState('Todas');
    const [formState, setFormState] = useState({
        nome: '',
        modelo: '',
        localizacao: '',
        ip: '',
        status: 'ativa',
        tintaPreta: 100,
        tintaCiano: 100,
        tintaMagenta: 100,
        tintaAmarela: 100,
        observacoes: ''
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
            tintaPreta: 100,
            tintaCiano: 100,
            tintaMagenta: 100,
            tintaAmarela: 100,
            observacoes: ''
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
            tintaPreta: printer.tintaPreta || 100,
            tintaCiano: printer.tintaCiano || 100,
            tintaMagenta: printer.tintaMagenta || 100,
            tintaAmarela: printer.tintaAmarela || 100,
            observacoes: printer.observacoes || ''
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

    // Função para verificar se a tinta está baixa
    const hasLowInk = (printer) => {
        const threshold = 20;
        return (
            (printer.tintaPreta || 100) <= threshold ||
            (printer.tintaCiano || 100) <= threshold ||
            (printer.tintaMagenta || 100) <= threshold ||
            (printer.tintaAmarela || 100) <= threshold
        );
    };

    // Função para obter o nível mínimo de tinta
    const getMinInkLevel = (printer) => {
        return Math.min(
            printer.tintaPreta || 100,
            printer.tintaCiano || 100,
            printer.tintaMagenta || 100,
            printer.tintaAmarela || 100
        );
    };

    // Filtrar impressoras
    const filteredPrinters = useMemo(() => {
        let filtered = printers;

        // Filtro por status
        if (statusFilter !== 'Todas') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        // Filtro por nível de tinta
        if (inkFilter === 'Baixa') {
            filtered = filtered.filter(p => hasLowInk(p));
        } else if (inkFilter === 'Crítica') {
            filtered = filtered.filter(p => getMinInkLevel(p) <= 10);
        }

        // Busca por texto
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.nome.toLowerCase().includes(term) ||
                (p.modelo && p.modelo.toLowerCase().includes(term)) ||
                (p.localizacao && p.localizacao.toLowerCase().includes(term)) ||
                (p.ip && p.ip.toLowerCase().includes(term))
            );
        }

        return filtered;
    }, [printers, statusFilter, inkFilter, searchTerm]);

    // Contar impressoras com tinta baixa
    const lowInkCount = useMemo(() => {
        return printers.filter(p => hasLowInk(p)).length;
    }, [printers]);

    return (
        <div>
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Gerenciar Impressoras</h2>
                    <Button onClick={openModalForNew}>
                        <Plus className="w-5 h-5"/>
                        Nova Impressora
                    </Button>
                </div>

                {/* Alerta de Tinta Baixa */}
                {lowInkCount > 0 && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-800">Atenção: Tinta Baixa!</h3>
                            <p className="text-sm text-red-700">
                                {lowInkCount} {lowInkCount === 1 ? 'impressora precisa' : 'impressoras precisam'} de reposição de tinta (≤ 20%)
                            </p>
                        </div>
                    </div>
                )}

                {/* Barra de Busca */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nome, modelo, localização ou IP..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="text-gray-600 w-5 h-5" />
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="Todas">Todos Status</option>
                            <option value="ativa">✅ Ativa</option>
                            <option value="manutencao">🔧 Manutenção</option>
                            <option value="inativa">❌ Inativa</option>
                        </select>
                    </div>

                    <select value={inkFilter} onChange={e => setInkFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                        <option value="Todas">Todos Níveis de Tinta</option>
                        <option value="Baixa">🟡 Tinta Baixa (≤ 20%)</option>
                        <option value="Crítica">🔴 Tinta Crítica (≤ 10%)</option>
                    </select>

                    {(searchTerm || statusFilter !== 'Todas' || inkFilter !== 'Todas') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('Todas');
                                setInkFilter('Todas');
                            }}
                            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>

                {/* Contador de Resultados */}
                <div className="mt-3 text-sm text-gray-600">
                    Mostrando <span className="font-semibold">{filteredPrinters.length}</span> de <span className="font-semibold">{printers.length}</span> impressoras
                </div>
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
                            {filteredPrinters.map(printer => (
                                <React.Fragment key={printer.id}>
                                    <tr className="border-b hover:bg-gray-50">
                                        <td className="p-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{printer.nome}</span>
                                                {hasLowInk(printer) && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold" title="Tinta baixa">
                                                        <Droplet className="w-3 h-3" />
                                                        Baixa
                                                    </span>
                                                )}
                                            </div>
                                        </td>
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
                                            <button 
                                                onClick={() => setExpandedPrinter(expandedPrinter === printer.id ? null : printer.id)} 
                                                className="text-gray-600 hover:text-gray-800"
                                                title="Ver detalhes"
                                            >
                                                <ChevronDown className={`w-5 h-5 transition-transform ${expandedPrinter === printer.id ? 'rotate-180' : ''}`}/>
                                            </button>
                                            <button onClick={() => openModalForEdit(printer)} className="text-blue-600 hover:text-blue-800">
                                                <Edit className="w-5 h-5"/>
                                            </button>
                                            <button onClick={() => handleDeletePrinter(printer.id)} className="text-red-600 hover:text-red-800">
                                                <Trash2 className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedPrinter === printer.id && (
                                        <tr className="bg-gray-50">
                                            <td colSpan="6" className="p-4">
                                                <div className="space-y-3">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-2">Níveis de Tinta</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            <div>
                                                                <div className="flex justify-between text-xs mb-1">
                                                                    <span className="text-gray-600">Preta</span>
                                                                    <span className="font-semibold">{printer.tintaPreta || 100}%</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                                    <div 
                                                                        className="bg-gray-800 h-2 rounded-full" 
                                                                        style={{ width: `${printer.tintaPreta || 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between text-xs mb-1">
                                                                    <span className="text-gray-600">Ciano</span>
                                                                    <span className="font-semibold">{printer.tintaCiano || 100}%</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                                    <div 
                                                                        className="bg-cyan-500 h-2 rounded-full" 
                                                                        style={{ width: `${printer.tintaCiano || 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between text-xs mb-1">
                                                                    <span className="text-gray-600">Magenta</span>
                                                                    <span className="font-semibold">{printer.tintaMagenta || 100}%</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                                    <div 
                                                                        className="bg-pink-500 h-2 rounded-full" 
                                                                        style={{ width: `${printer.tintaMagenta || 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between text-xs mb-1">
                                                                    <span className="text-gray-600">Amarela</span>
                                                                    <span className="font-semibold">{printer.tintaAmarela || 100}%</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                                    <div 
                                                                        className="bg-yellow-400 h-2 rounded-full" 
                                                                        style={{ width: `${printer.tintaAmarela || 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {printer.observacoes && (
                                                        <div>
                                                            <h4 className="font-semibold text-gray-700 mb-1">Observações</h4>
                                                            <p className="text-sm text-gray-600 bg-white p-2 rounded border">{printer.observacoes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    {printers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Nenhuma impressora cadastrada. Clique em "Nova Impressora" para adicionar.
                        </div>
                    ) : filteredPrinters.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Nenhuma impressora encontrada com os filtros aplicados.
                        </div>
                    ) : null}
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentPrinter ? 'Editar Impressora' : 'Nova Impressora'} size="lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                            <Input name="nome" value={formState.nome} onChange={handleFormChange} placeholder="Ex: Impressora Recepção" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
                            <Input name="modelo" value={formState.modelo} onChange={handleFormChange} placeholder="Ex: HP LaserJet Pro M404" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                            <Input name="localizacao" value={formState.localizacao} onChange={handleFormChange} placeholder="Ex: Sala 101" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço IP</label>
                            <Input name="ip" value={formState.ip} onChange={handleFormChange} placeholder="Ex: 192.168.1.100" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select name="status" value={formState.status} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="ativa">Ativa</option>
                            <option value="manutencao">Manutenção</option>
                            <option value="inativa">Inativa</option>
                        </select>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-700 mb-3">Níveis de Tinta (%)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preta</label>
                                <Input 
                                    type="number" 
                                    name="tintaPreta" 
                                    value={formState.tintaPreta} 
                                    onChange={handleFormChange} 
                                    placeholder="0-100"
                                    min="0"
                                    max="100"
                                />
                                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-gray-800 h-2 rounded-full transition-all" 
                                        style={{ width: `${formState.tintaPreta}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ciano</label>
                                <Input 
                                    type="number" 
                                    name="tintaCiano" 
                                    value={formState.tintaCiano} 
                                    onChange={handleFormChange} 
                                    placeholder="0-100"
                                    min="0"
                                    max="100"
                                />
                                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-cyan-500 h-2 rounded-full transition-all" 
                                        style={{ width: `${formState.tintaCiano}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Magenta</label>
                                <Input 
                                    type="number" 
                                    name="tintaMagenta" 
                                    value={formState.tintaMagenta} 
                                    onChange={handleFormChange} 
                                    placeholder="0-100"
                                    min="0"
                                    max="100"
                                />
                                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-pink-500 h-2 rounded-full transition-all" 
                                        style={{ width: `${formState.tintaMagenta}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amarela</label>
                                <Input 
                                    type="number" 
                                    name="tintaAmarela" 
                                    value={formState.tintaAmarela} 
                                    onChange={handleFormChange} 
                                    placeholder="0-100"
                                    min="0"
                                    max="100"
                                />
                                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-yellow-400 h-2 rounded-full transition-all" 
                                        style={{ width: `${formState.tintaAmarela}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações / Problemas</label>
                        <textarea 
                            name="observacoes" 
                            value={formState.observacoes} 
                            onChange={handleFormChange} 
                            rows="3" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="Anote aqui problemas, manutenções necessárias, etc..."
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleFormSubmit}>Salvar Impressora</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const AdminPage = ({ routines, users }) => {
    const [adminTab, setAdminTab] = useState('routines');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRoutine, setCurrentRoutine] = useState(null);
    const [formState, setFormState] = useState({
        nome: '',
        descricao: '',
        categoria: 'Rede',
        frequencia: 'diaria',
        prioridade: 'media',
        responsavel: '',
        instrucoes: '',
        checklist: [],
        assignedTechnicians: []
    });
    const [checklistInput, setChecklistInput] = useState('');

    const openModalForNew = () => {
        setCurrentRoutine(null);
        setFormState({
            nome: '',
            descricao: '',
            categoria: 'Rede',
            frequencia: 'diaria',
            prioridade: 'media',
            responsavel: '',
            instrucoes: '',
            checklist: [],
            assignedTechnicians: []
        });
        setChecklistInput('');
        setIsModalOpen(true);
    };
    
    const openModalForEdit = (routine) => {
        setCurrentRoutine(routine);
        setFormState({
            nome: routine.nome,
            descricao: routine.descricao,
            categoria: routine.categoria,
            frequencia: routine.frequencia,
            prioridade: routine.prioridade || 'media',
            responsavel: routine.responsavel || '',
            instrucoes: routine.instrucoes || '',
            checklist: routine.checklist || [],
            assignedTechnicians: routine.assignedTechnicians || []
        });
        setChecklistInput('');
        setIsModalOpen(true);
    };

    const toggleTechnician = (technicianId) => {
        setFormState(prev => {
            const assigned = prev.assignedTechnicians || [];
            if (assigned.includes(technicianId)) {
                return {
                    ...prev,
                    assignedTechnicians: assigned.filter(id => id !== technicianId)
                };
            } else {
                return {
                    ...prev,
                    assignedTechnicians: [...assigned, technicianId]
                };
            }
        });
    };
    
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const addChecklistItem = () => {
        if (checklistInput.trim()) {
            setFormState(prev => ({
                ...prev,
                checklist: [...prev.checklist, checklistInput.trim()]
            }));
            setChecklistInput('');
        }
    };

    const removeChecklistItem = (index) => {
        setFormState(prev => ({
            ...prev,
            checklist: prev.checklist.filter((_, i) => i !== index)
        }));
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
                <button onClick={() => setAdminTab('routines')} className={`px-4 py-2 font-semibold ${adminTab === 'routines' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                    Gerenciar Rotinas
                </button>
                <button onClick={() => setAdminTab('users')} className={`px-4 py-2 font-semibold ${adminTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                    Gerenciar Usuários
                </button>
            </div>

            {adminTab === 'routines' && (
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
                                        <th className="p-2">Técnicos Atribuídos</th>
                                        <th className="p-2">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routines.map(routine => {
                                        const assignedUsers = users.filter(u => 
                                            routine.assignedTechnicians?.includes(u.uid)
                                        );
                                        return (
                                            <tr key={routine.id} className="border-b hover:bg-gray-50">
                                                <td className="p-2 font-medium">{routine.nome}</td>
                                                <td className="p-2">{routine.categoria}</td>
                                                <td className="p-2 capitalize">{routine.frequencia}</td>
                                                <td className="p-2">
                                                    {assignedUsers.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {assignedUsers.map(user => (
                                                                <span 
                                                                    key={user.uid}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                                                                >
                                                                    <UserCheck className="w-3 h-3" />
                                                                    {user.nome}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-500 italic">Todos</span>
                                                    )}
                                                </td>
                                                <td className="p-2 flex gap-2">
                                                    <button onClick={() => openModalForEdit(routine)} className="text-blue-600 hover:text-blue-800"><Edit className="w-5 h-5"/></button>
                                                    <button onClick={() => handleDeleteRoutine(routine.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5"/></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
            
            {adminTab === 'users' && (
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentRoutine ? 'Editar Rotina' : 'Nova Rotina'} size="lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                            <Input name="nome" value={formState.nome} onChange={handleFormChange} placeholder="Ex: Verificar Backup Servidor X" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                            <select name="categoria" value={formState.categoria} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="Rede">Rede</option>
                                <option value="Computadores">Computadores</option>
                                <option value="Impressoras">Impressoras</option>
                                <option value="Backup">Backup</option>
                                <option value="Servidores">Servidores</option>
                                <option value="Segurança">Segurança</option>
                                <option value="Consultórios">Consultórios</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea name="descricao" value={formState.descricao} onChange={handleFormChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Detalhes da tarefa..."></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
                            <select name="frequencia" value={formState.frequencia} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="diaria">Diária</option>
                                <option value="semanal">Semanal</option>
                                <option value="mensal">Mensal</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                            <select name="prioridade" value={formState.prioridade} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="baixa">Baixa</option>
                                <option value="media">Média</option>
                                <option value="alta">Alta</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                            <Input name="responsavel" value={formState.responsavel} onChange={handleFormChange} placeholder="Nome do responsável" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instruções Específicas</label>
                        <textarea 
                            name="instrucoes" 
                            value={formState.instrucoes} 
                            onChange={handleFormChange} 
                            rows="3" 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                            placeholder="Ex: Verificar nível de tinta da HP M402, conferir temperatura do servidor..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Checklist</label>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Input 
                                    value={checklistInput} 
                                    onChange={e => setChecklistInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                                    placeholder="Digite um item e pressione Enter ou clique em Adicionar"
                                    className="flex-1"
                                />
                                <Button type="button" onClick={addChecklistItem} variant="secondary">
                                    <Plus className="w-4 h-4" />
                                    Adicionar
                                </Button>
                            </div>
                            {formState.checklist.length > 0 && (
                                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                    {formState.checklist.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                                            <span className="text-sm text-gray-700">{item}</span>
                                            <button 
                                                type="button"
                                                onClick={() => removeChecklistItem(index)} 
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Atribuir Técnicos */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <UserCog className="w-4 h-4" />
                            Atribuir Técnicos (opcional)
                        </label>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            {users.filter(u => u.tipo !== 'admin').length > 0 ? (
                                users.filter(u => u.tipo !== 'admin').map(user => (
                                    <label key={user.uid} className="flex items-center gap-3 p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formState.assignedTechnicians?.includes(user.uid) || false}
                                            onChange={() => toggleTechnician(user.uid)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">{user.nome}</p>
                                            <p className="text-xs text-gray-500 capitalize">{user.tipo}</p>
                                        </div>
                                        {user.tipo === 'estagiario' && (
                                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                Estagiário
                                            </span>
                                        )}
                                    </label>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-2">Nenhum técnico cadastrado</p>
                            )}
                            {formState.assignedTechnicians?.length === 0 && (
                                <p className="text-xs text-gray-500 italic mt-2">
                                    Se nenhum técnico for selecionado, todos poderão visualizar e executar esta rotina.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleFormSubmit}>Salvar Rotina</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// --- Página de Relatórios ---
const ReportsPage = ({ executions, routines, users }) => {
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    
    const stats = useMemo(() => {
        const now = new Date();
        let startDate;
        
        switch(selectedPeriod) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate = new Date(0);
        }
        
        const periodExecutions = executions.filter(e => e.dataHora.toDate() >= startDate);
        
        // Tempo médio de execução por rotina
        const routineStats = {};
        periodExecutions.forEach(exec => {
            if (!routineStats[exec.rotinaId]) {
                routineStats[exec.rotinaId] = {
                    count: 0,
                    routine: routines.find(r => r.id === exec.rotinaId)
                };
            }
            routineStats[exec.rotinaId].count++;
        });
        
        // Ranking de técnicos
        const technicianStats = {};
        periodExecutions.forEach(exec => {
            if (!technicianStats[exec.responsavelId]) {
                technicianStats[exec.responsavelId] = {
                    name: exec.responsavelNome,
                    count: 0,
                    routines: new Set()
                };
            }
            technicianStats[exec.responsavelId].count++;
            technicianStats[exec.responsavelId].routines.add(exec.rotinaId);
        });
        
        const technicianRanking = Object.values(technicianStats)
            .map(t => ({
                ...t,
                uniqueRoutines: t.routines.size
            }))
            .sort((a, b) => b.count - a.count);
        
        // Rotinas mais executadas
        const topRoutines = Object.values(routineStats)
            .filter(r => r.routine)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        
        // Execuções por categoria
        const categoryStats = {};
        periodExecutions.forEach(exec => {
            const routine = routines.find(r => r.id === exec.rotinaId);
            if (routine) {
                categoryStats[routine.categoria] = (categoryStats[routine.categoria] || 0) + 1;
            }
        });
        
        // Execuções por dia da semana
        const weekdayStats = {
            'Dom': 0, 'Seg': 0, 'Ter': 0, 'Qua': 0, 'Qui': 0, 'Sex': 0, 'Sáb': 0
        };
        const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        periodExecutions.forEach(exec => {
            const day = exec.dataHora.toDate().getDay();
            weekdayStats[weekdayNames[day]]++;
        });
        
        return {
            totalExecutions: periodExecutions.length,
            technicianRanking,
            topRoutines,
            categoryStats,
            weekdayStats,
            avgPerDay: (periodExecutions.length / Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)))).toFixed(1)
        };
    }, [executions, routines, selectedPeriod]);
    
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Relatórios e Métricas</h2>
                <select 
                    value={selectedPeriod} 
                    onChange={e => setSelectedPeriod(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2"
                >
                    <option value="week">Última Semana</option>
                    <option value="month">Último Mês</option>
                    <option value="year">Último Ano</option>
                    <option value="all">Todo Período</option>
                </select>
            </div>
            
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total de Execuções</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalExecutions}</p>
                        </div>
                    </div>
                </Card>
                
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Média por Dia</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.avgPerDay}</p>
                        </div>
                    </div>
                </Card>
                
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Técnicos Ativos</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.technicianRanking.length}</p>
                        </div>
                    </div>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ranking de Técnicos */}
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        Ranking de Técnicos
                    </h3>
                    <div className="space-y-3">
                        {stats.technicianRanking.map((tech, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                        index === 0 ? 'bg-yellow-500' :
                                        index === 1 ? 'bg-gray-400' :
                                        index === 2 ? 'bg-orange-600' :
                                        'bg-blue-500'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{tech.name}</p>
                                        <p className="text-xs text-gray-500">{tech.uniqueRoutines} rotinas diferentes</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-blue-600">{tech.count}</p>
                                    <p className="text-xs text-gray-500">execuções</p>
                                </div>
                            </div>
                        ))}
                        {stats.technicianRanking.length === 0 && (
                            <p className="text-center text-gray-500 py-4">Nenhuma execução no período</p>
                        )}
                    </div>
                </Card>
                
                {/* Top 5 Rotinas */}
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Rotinas Mais Executadas
                    </h3>
                    <div className="space-y-3">
                        {stats.topRoutines.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{item.routine.nome}</p>
                                    <p className="text-xs text-gray-500">{item.routine.categoria}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-green-600">{item.count}</p>
                                    <p className="text-xs text-gray-500">vezes</p>
                                </div>
                            </div>
                        ))}
                        {stats.topRoutines.length === 0 && (
                            <p className="text-center text-gray-500 py-4">Nenhuma execução no período</p>
                        )}
                    </div>
                </Card>
                
                {/* Execuções por Categoria */}
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Execuções por Categoria</h3>
                    <div className="space-y-2">
                        {Object.entries(stats.categoryStats).map(([category, count]) => {
                            const percentage = (count / stats.totalExecutions * 100).toFixed(1);
                            return (
                                <div key={category}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">{category}</span>
                                        <span className="text-gray-600">{count} ({percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(stats.categoryStats).length === 0 && (
                            <p className="text-center text-gray-500 py-4">Nenhuma execução no período</p>
                        )}
                    </div>
                </Card>
                
                {/* Execuções por Dia da Semana */}
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Execuções por Dia da Semana</h3>
                    <div className="space-y-2">
                        {Object.entries(stats.weekdayStats).map(([day, count]) => {
                            const maxCount = Math.max(...Object.values(stats.weekdayStats));
                            const percentage = maxCount > 0 ? (count / maxCount * 100).toFixed(1) : 0;
                            return (
                                <div key={day}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">{day}</span>
                                        <span className="text-gray-600">{count}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-purple-600 h-2 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- Página de Relatórios Automáticos ---
const AutoReportsPage = ({ executions, routines, users }) => {
    const [reportPeriod, setReportPeriod] = useState('today');
    const [generating, setGenerating] = useState(false);

    const generateReport = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        
        switch(reportPeriod) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
        }
        
        const periodExecutions = executions.filter(e => e.dataHora.toDate() >= startDate);
        
        // Rotinas concluídas
        const completedRoutines = periodExecutions.map(exec => {
            const routine = routines.find(r => r.id === exec.rotinaId);
            return {
                ...exec,
                routine
            };
        });
        
        // Rotinas pendentes
        const pendingRoutines = routines.filter(routine => {
            const lastExec = executions
                .filter(e => e.rotinaId === routine.id)
                .sort((a, b) => b.dataHora.toMillis() - a.dataHora.toMillis())[0];
            
            if (!lastExec) return true;
            
            const lastExecDate = lastExec.dataHora.toDate();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            switch(routine.frequencia) {
                case 'diaria':
                    return lastExecDate < today;
                case 'semanal':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    return lastExecDate < weekAgo;
                case 'mensal':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    return lastExecDate < monthAgo;
                default:
                    return false;
            }
        });
        
        // Problemas encontrados (observações com palavras-chave)
        const problemKeywords = ['problema', 'erro', 'falha', 'não', 'defeito', 'quebrado'];
        const issues = periodExecutions.filter(exec => {
            const obs = (exec.observacao || '').toLowerCase();
            return problemKeywords.some(keyword => obs.includes(keyword));
        });
        
        // Performance por técnico
        const technicianPerformance = {};
        periodExecutions.forEach(exec => {
            if (!technicianPerformance[exec.responsavelId]) {
                technicianPerformance[exec.responsavelId] = {
                    name: exec.responsavelNome,
                    completed: 0,
                    withPhoto: 0
                };
            }
            technicianPerformance[exec.responsavelId].completed++;
            if (exec.fotoUrl) {
                technicianPerformance[exec.responsavelId].withPhoto++;
            }
        });
        
        return {
            period: reportPeriod,
            startDate,
            endDate: now,
            totalCompleted: periodExecutions.length,
            totalPending: pendingRoutines.length,
            completedRoutines,
            pendingRoutines,
            issues,
            technicianPerformance: Object.values(technicianPerformance)
        };
    }, [reportPeriod, executions, routines]);

    const downloadReport = () => {
        setGenerating(true);
        
        const report = generateReport;
        const reportText = `
RELATÓRIO AUTOMÁTICO DE ROTINAS
Período: ${report.period === 'today' ? 'Hoje' : report.period === 'week' ? 'Última Semana' : 'Último Mês'}
Data: ${report.startDate.toLocaleDateString('pt-BR')} até ${report.endDate.toLocaleDateString('pt-BR')}

═══════════════════════════════════════════════════════════

RESUMO GERAL
- Total de rotinas concluídas: ${report.totalCompleted}
- Total de rotinas pendentes: ${report.totalPending}
- Taxa de conclusão: ${((report.totalCompleted / (report.totalCompleted + report.totalPending)) * 100).toFixed(1)}%

═══════════════════════════════════════════════════════════

ROTINAS CONCLUÍDAS (${report.completedRoutines.length})
${report.completedRoutines.map((exec, i) => `
${i + 1}. ${exec.routine?.nome || 'Rotina removida'}
   - Executado por: ${exec.responsavelNome}
   - Data: ${exec.dataHora.toDate().toLocaleString('pt-BR')}
   - Observação: ${exec.observacao || 'Nenhuma'}
   - Foto: ${exec.fotoUrl ? 'Sim' : 'Não'}
`).join('')}

═══════════════════════════════════════════════════════════

ROTINAS PENDENTES (${report.pendingRoutines.length})
${report.pendingRoutines.map((routine, i) => `
${i + 1}. ${routine.nome}
   - Categoria: ${routine.categoria}
   - Frequência: ${routine.frequencia}
   - Prioridade: ${routine.prioridade}
`).join('')}

═══════════════════════════════════════════════════════════

PROBLEMAS ENCONTRADOS (${report.issues.length})
${report.issues.map((exec, i) => `
${i + 1}. ${routines.find(r => r.id === exec.rotinaId)?.nome || 'Rotina removida'}
   - Relatado por: ${exec.responsavelNome}
   - Data: ${exec.dataHora.toDate().toLocaleString('pt-BR')}
   - Descrição: ${exec.observacao}
`).join('')}

═══════════════════════════════════════════════════════════

PERFORMANCE POR TÉCNICO
${report.technicianPerformance.map((tech, i) => `
${i + 1}. ${tech.name}
   - Rotinas concluídas: ${tech.completed}
   - Com evidência fotográfica: ${tech.withPhoto} (${((tech.withPhoto / tech.completed) * 100).toFixed(1)}%)
`).join('')}

═══════════════════════════════════════════════════════════

Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}
        `.trim();
        
        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${reportPeriod}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setTimeout(() => setGenerating(false), 1000);
    };

    const report = generateReport;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Relatórios Automáticos</h2>
                <div className="flex gap-2">
                    <select
                        value={reportPeriod}
                        onChange={e => setReportPeriod(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2"
                    >
                        <option value="today">Hoje</option>
                        <option value="week">Última Semana</option>
                        <option value="month">Último Mês</option>
                    </select>
                    <Button onClick={downloadReport} disabled={generating}>
                        <Download className="w-4 h-4" />
                        {generating ? 'Gerando...' : 'Baixar Relatório'}
                    </Button>
                </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-full">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Concluídas</p>
                            <p className="text-2xl font-bold text-gray-800">{report.totalCompleted}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pendentes</p>
                            <p className="text-2xl font-bold text-gray-800">{report.totalPending}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Problemas</p>
                            <p className="text-2xl font-bold text-gray-800">{report.issues.length}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Taxa de Conclusão</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {((report.totalCompleted / (report.totalCompleted + report.totalPending)) * 100).toFixed(0)}%
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Detalhes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Problemas Encontrados */}
                {report.issues.length > 0 && (
                    <Card>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            Problemas Encontrados
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {report.issues.map((exec, index) => (
                                <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                                    <p className="font-semibold text-gray-800">
                                        {routines.find(r => r.id === exec.rotinaId)?.nome || 'Rotina removida'}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">{exec.observacao}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {exec.responsavelNome} • {exec.dataHora.toDate().toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Performance por Técnico */}
                <Card>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Performance por Técnico</h3>
                    <div className="space-y-3">
                        {report.technicianPerformance.map((tech, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-semibold text-gray-800">{tech.name}</p>
                                    <span className="text-2xl font-bold text-blue-600">{tech.completed}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Camera className="w-4 h-4" />
                                    <span>{tech.withPhoto} com foto ({((tech.withPhoto / tech.completed) * 100).toFixed(0)}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- Página de Estoque ---
const StockPage = ({ userData }) => {
    const [stockItems, setStockItems] = useState([]);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todas');
    const [stockFilter, setStockFilter] = useState('Todos');
    
    const [formState, setFormState] = useState({
        nome: '',
        categoria: 'Toner',
        quantidade: 0,
        quantidadeMinima: 5,
        unidade: 'unidade',
        localizacao: '',
        observacoes: ''
    });

    const [movementForm, setMovementForm] = useState({
        tipo: 'entrada',
        quantidade: 0,
        motivo: '',
        responsavel: userData?.nome || ''
    });

    // Carregar itens do estoque
    useEffect(() => {
        const stockRef = collection(db, `/artifacts/${appId}/stock/items/list`);
        const unsubStock = onSnapshot(stockRef, 
            (snapshot) => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStockItems(items);
                setLoading(false);
            },
            (error) => {
                console.error('Erro ao carregar estoque:', error);
                setLoading(false);
            }
        );

        const movementsRef = collection(db, `/artifacts/${appId}/stock/movements/list`);
        const unsubMovements = onSnapshot(movementsRef, 
            (snapshot) => {
                const movs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
                setMovements(movs);
            },
            (error) => {
                console.error('Erro ao carregar movimentações:', error);
            }
        );

        return () => {
            unsubStock();
            unsubMovements();
        };
    }, []);

    const openModalForNew = () => {
        setCurrentItem(null);
        setFormState({
            nome: '',
            categoria: 'Toner',
            quantidade: 0,
            quantidadeMinima: 5,
            unidade: 'unidade',
            localizacao: '',
            observacoes: ''
        });
        setIsModalOpen(true);
    };

    const openModalForEdit = (item) => {
        setCurrentItem(item);
        setFormState({
            nome: item.nome,
            categoria: item.categoria,
            quantidade: item.quantidade,
            quantidadeMinima: item.quantidadeMinima,
            unidade: item.unidade,
            localizacao: item.localizacao || '',
            observacoes: item.observacoes || ''
        });
        setIsModalOpen(true);
    };

    const openMovementModal = (item) => {
        setSelectedItem(item);
        setMovementForm({
            tipo: 'entrada',
            quantidade: 0,
            motivo: '',
            responsavel: userData?.nome || ''
        });
        setIsMovementModalOpen(true);
    };

    const handleFormSubmit = async () => {
        if (!formState.nome) {
            alert('Nome do item é obrigatório');
            return;
        }

        try {
            const itemData = {
                ...formState,
                quantidade: Number(formState.quantidade),
                quantidadeMinima: Number(formState.quantidadeMinima),
                updatedAt: Timestamp.now()
            };

            if (currentItem) {
                await updateDoc(doc(db, `/artifacts/${appId}/stock/items/list`, currentItem.id), itemData);
                
                await logActivity(
                    userData.uid,
                    userData.nome,
                    'EDICAO_ESTOQUE',
                    { itemId: currentItem.id, itemNome: formState.nome }
                );
            } else {
                itemData.createdAt = Timestamp.now();
                itemData.createdBy = userData.nome;
                
                await addDoc(collection(db, `/artifacts/${appId}/stock/items/list`), itemData);
                
                await logActivity(
                    userData.uid,
                    userData.nome,
                    'CRIACAO_ESTOQUE',
                    { itemNome: formState.nome }
                );
            }

            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar item:', error);
            alert('Erro ao salvar item');
        }
    };

    const handleMovementSubmit = async () => {
        if (!movementForm.quantidade || movementForm.quantidade <= 0) {
            alert('Quantidade deve ser maior que zero');
            return;
        }

        try {
            const movement = {
                itemId: selectedItem.id,
                itemNome: selectedItem.nome,
                tipo: movementForm.tipo,
                quantidade: Number(movementForm.quantidade),
                motivo: movementForm.motivo,
                responsavel: movementForm.responsavel,
                timestamp: Timestamp.now(),
                quantidadeAnterior: selectedItem.quantidade
            };

            // Registrar movimentação
            await addDoc(collection(db, `/artifacts/${appId}/stock/movements/list`), movement);

            // Atualizar quantidade do item
            const newQuantity = movementForm.tipo === 'entrada'
                ? selectedItem.quantidade + Number(movementForm.quantidade)
                : selectedItem.quantidade - Number(movementForm.quantidade);

            await updateDoc(doc(db, `/artifacts/${appId}/stock/items/list`, selectedItem.id), {
                quantidade: newQuantity,
                updatedAt: Timestamp.now()
            });

            // Log de atividade
            await logActivity(
                userData.uid,
                userData.nome,
                movementForm.tipo === 'entrada' ? 'ENTRADA_ESTOQUE' : 'SAIDA_ESTOQUE',
                {
                    itemNome: selectedItem.nome,
                    quantidade: movementForm.quantidade,
                    motivo: movementForm.motivo
                }
            );

            // Verificar se ficou abaixo do mínimo e criar notificação
            if (newQuantity <= selectedItem.quantidadeMinima) {
                await createNotification(
                    userData.uid,
                    userData.nome,
                    'stock_low',
                    `Estoque baixo: ${selectedItem.nome} (${newQuantity} ${selectedItem.unidade})`,
                    selectedItem.id,
                    'high'
                );
            }

            setIsMovementModalOpen(false);
        } catch (error) {
            console.error('Erro ao registrar movimentação:', error);
            alert('Erro ao registrar movimentação');
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Tem certeza que deseja excluir este item?')) {
            try {
                await deleteDoc(doc(db, `/artifacts/${appId}/stock/items/list`, itemId));
                
                await logActivity(
                    userData.uid,
                    userData.nome,
                    'EXCLUSAO_ESTOQUE',
                    { itemId }
                );
            } catch (error) {
                console.error('Erro ao excluir item:', error);
                alert('Erro ao excluir item');
            }
        }
    };

    const filteredItems = useMemo(() => {
        let filtered = stockItems;

        if (categoryFilter !== 'Todas') {
            filtered = filtered.filter(item => item.categoria === categoryFilter);
        }

        if (stockFilter === 'Baixo') {
            filtered = filtered.filter(item => item.quantidade <= item.quantidadeMinima);
        } else if (stockFilter === 'Normal') {
            filtered = filtered.filter(item => item.quantidade > item.quantidadeMinima);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.nome.toLowerCase().includes(term) ||
                (item.localizacao && item.localizacao.toLowerCase().includes(term))
            );
        }

        return filtered;
    }, [stockItems, categoryFilter, stockFilter, searchTerm]);

    const categories = ['Todas', ...new Set(stockItems.map(item => item.categoria || 'Outros'))];
    const lowStockCount = stockItems.filter(item => 
        item.quantidade !== undefined && 
        item.quantidadeMinima !== undefined && 
        item.quantidade <= item.quantidadeMinima
    ).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner />
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Controle de Estoque</h2>
                    {lowStockCount > 0 && (
                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            {lowStockCount} item(ns) com estoque baixo
                        </p>
                    )}
                </div>
                {hasPermission(userData?.tipo, 'canManageRoutines') && (
                    <Button onClick={openModalForNew}>
                        <PackagePlus className="w-5 h-5" />
                        Novo Item
                    </Button>
                )}
            </div>

            {/* Filtros */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Nome ou localização..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoria
                        </label>
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={stockFilter}
                            onChange={e => setStockFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Todos">Todos</option>
                            <option value="Baixo">Estoque Baixo</option>
                            <option value="Normal">Estoque Normal</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Lista de Itens */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => {
                    const isLowStock = item.quantidade <= item.quantidadeMinima;
                    const stockPercentage = (item.quantidade / (item.quantidadeMinima * 2)) * 100;

                    return (
                        <Card key={item.id} className={isLowStock ? 'border-l-4 border-red-500' : ''}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-800">{item.nome}</h3>
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                        {item.categoria}
                                    </span>
                                </div>
                                {isLowStock && (
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                )}
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Quantidade:</span>
                                    <span className={`text-2xl font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                                        {item.quantidade} {item.unidade}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Mínimo:</span>
                                    <span className="text-gray-800">{item.quantidadeMinima} {item.unidade}</span>
                                </div>
                                {item.localizacao && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Archive className="w-4 h-4" />
                                        {item.localizacao}
                                    </div>
                                )}
                            </div>

                            {/* Barra de progresso */}
                            <div className="mb-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${
                                            isLowStock ? 'bg-red-500' : 'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => openMovementModal(item)}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    <PackageSearch className="w-4 h-4" />
                                    Movimentar
                                </Button>
                                {hasPermission(userData?.tipo, 'canManageRoutines') && (
                                    <>
                                        <button
                                            onClick={() => openModalForEdit(item)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {filteredItems.length === 0 && (
                <Card>
                    <div className="text-center py-12 text-gray-500">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>Nenhum item encontrado</p>
                    </div>
                </Card>
            )}

            {/* Modal de Item */}
            {isModalOpen && (
                <Modal
                    title={currentItem ? 'Editar Item' : 'Novo Item'}
                    onClose={() => setIsModalOpen(false)}
                    size="lg"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome do Item *
                                </label>
                                <Input
                                    value={formState.nome}
                                    onChange={e => setFormState({ ...formState, nome: e.target.value })}
                                    placeholder="Ex: Toner HP CF283A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Categoria
                                </label>
                                <select
                                    value={formState.categoria}
                                    onChange={e => setFormState({ ...formState, categoria: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="Toner">Toner</option>
                                    <option value="Cabo">Cabo</option>
                                    <option value="HD">HD</option>
                                    <option value="SSD">SSD</option>
                                    <option value="Memória RAM">Memória RAM</option>
                                    <option value="Mouse">Mouse</option>
                                    <option value="Teclado">Teclado</option>
                                    <option value="Fonte">Fonte</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantidade Atual
                                </label>
                                <Input
                                    type="number"
                                    value={formState.quantidade}
                                    onChange={e => setFormState({ ...formState, quantidade: e.target.value })}
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantidade Mínima
                                </label>
                                <Input
                                    type="number"
                                    value={formState.quantidadeMinima}
                                    onChange={e => setFormState({ ...formState, quantidadeMinima: e.target.value })}
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unidade
                                </label>
                                <select
                                    value={formState.unidade}
                                    onChange={e => setFormState({ ...formState, unidade: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="unidade">Unidade</option>
                                    <option value="caixa">Caixa</option>
                                    <option value="metro">Metro</option>
                                    <option value="pacote">Pacote</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Localização
                            </label>
                            <Input
                                value={formState.localizacao}
                                onChange={e => setFormState({ ...formState, localizacao: e.target.value })}
                                placeholder="Ex: Armário 2, Prateleira 3"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Observações
                            </label>
                            <textarea
                                value={formState.observacoes}
                                onChange={e => setFormState({ ...formState, observacoes: e.target.value })}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Informações adicionais..."
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleFormSubmit}>
                                Salvar Item
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal de Movimentação */}
            {isMovementModalOpen && selectedItem && (
                <Modal
                    title={`Movimentar: ${selectedItem.nome}`}
                    onClose={() => setIsMovementModalOpen(false)}
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Estoque Atual:</span>
                                <span className="text-2xl font-bold text-gray-800">
                                    {selectedItem.quantidade} {selectedItem.unidade}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Movimentação
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setMovementForm({ ...movementForm, tipo: 'entrada' })}
                                    className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                                        movementForm.tipo === 'entrada'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-300 text-gray-600'
                                    }`}
                                >
                                    <PackagePlus className="w-5 h-5" />
                                    Entrada
                                </button>
                                <button
                                    onClick={() => setMovementForm({ ...movementForm, tipo: 'saida' })}
                                    className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${
                                        movementForm.tipo === 'saida'
                                            ? 'border-red-500 bg-red-50 text-red-700'
                                            : 'border-gray-300 text-gray-600'
                                    }`}
                                >
                                    <PackageMinus className="w-5 h-5" />
                                    Saída
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantidade
                            </label>
                            <Input
                                type="number"
                                value={movementForm.quantidade}
                                onChange={e => setMovementForm({ ...movementForm, quantidade: e.target.value })}
                                min="1"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Motivo
                            </label>
                            <textarea
                                value={movementForm.motivo}
                                onChange={e => setMovementForm({ ...movementForm, motivo: e.target.value })}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Ex: Compra, Uso em manutenção, Troca de equipamento..."
                            />
                        </div>

                        {movementForm.quantidade > 0 && (
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Novo estoque:</strong>{' '}
                                    {movementForm.tipo === 'entrada'
                                        ? selectedItem.quantidade + Number(movementForm.quantidade)
                                        : selectedItem.quantidade - Number(movementForm.quantidade)
                                    } {selectedItem.unidade}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="secondary" onClick={() => setIsMovementModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleMovementSubmit}>
                                Confirmar Movimentação
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// --- Página de Logs de Atividades ---
const ActivityLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [filterUser, setFilterUser] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const logsRef = collection(db, `/artifacts/${appId}/activityLogs`);
        const unsubscribe = onSnapshot(logsRef, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
            setLogs(logsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredLogs = useMemo(() => {
        let filtered = logs;

        if (filterUser) {
            filtered = filtered.filter(log => 
                log.userName.toLowerCase().includes(filterUser.toLowerCase())
            );
        }

        if (filterAction) {
            filtered = filtered.filter(log => log.action === filterAction);
        }

        return filtered;
    }, [logs, filterUser, filterAction]);

    const actionTypes = [...new Set(logs.map(log => log.action))];

    const getActionLabel = (action) => {
        const labels = {
            'EXECUCAO_ROTINA': 'Execução de Rotina',
            'CRIACAO_ROTINA': 'Criação de Rotina',
            'EDICAO_ROTINA': 'Edição de Rotina',
            'EXCLUSAO_ROTINA': 'Exclusão de Rotina',
            'CRIACAO_IMPRESSORA': 'Criação de Impressora',
            'EDICAO_IMPRESSORA': 'Edição de Impressora',
            'EXCLUSAO_IMPRESSORA': 'Exclusão de Impressora',
            'CRIACAO_ESTOQUE': 'Criação de Item no Estoque',
            'EDICAO_ESTOQUE': 'Edição de Item no Estoque',
            'EXCLUSAO_ESTOQUE': 'Exclusão de Item no Estoque',
            'ENTRADA_ESTOQUE': 'Entrada no Estoque',
            'SAIDA_ESTOQUE': 'Saída do Estoque',
            'LOGIN': 'Login',
            'LOGOUT': 'Logout'
        };
        return labels[action] || action;
    };

    const getActionIcon = (action) => {
        switch(action) {
            case 'EXECUCAO_ROTINA':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'CRIACAO_ROTINA':
            case 'CRIACAO_IMPRESSORA':
            case 'CRIACAO_ESTOQUE':
                return <Plus className="w-5 h-5 text-blue-600" />;
            case 'EDICAO_ROTINA':
            case 'EDICAO_IMPRESSORA':
            case 'EDICAO_ESTOQUE':
                return <Edit className="w-5 h-5 text-yellow-600" />;
            case 'EXCLUSAO_ROTINA':
            case 'EXCLUSAO_IMPRESSORA':
            case 'EXCLUSAO_ESTOQUE':
                return <Trash2 className="w-5 h-5 text-red-600" />;
            case 'ENTRADA_ESTOQUE':
                return <PackagePlus className="w-5 h-5 text-green-600" />;
            case 'SAIDA_ESTOQUE':
                return <PackageMinus className="w-5 h-5 text-orange-600" />;
            case 'LOGIN':
                return <UserCheck className="w-5 h-5 text-green-600" />;
            case 'LOGOUT':
                return <LogOut className="w-5 h-5 text-gray-600" />;
            default:
                return <Activity className="w-5 h-5 text-gray-600" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-600">Carregando logs...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Logs de Atividades</h2>
                
                {/* Filtros */}
                <Card>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filtrar por Usuário
                            </label>
                            <input
                                type="text"
                                value={filterUser}
                                onChange={e => setFilterUser(e.target.value)}
                                placeholder="Nome do usuário..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filtrar por Ação
                            </label>
                            <select
                                value={filterAction}
                                onChange={e => setFilterAction(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todas as Ações</option>
                                {actionTypes.map(action => (
                                    <option key={action} value={action}>
                                        {getActionLabel(action)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={() => {
                                    setFilterUser('');
                                    setFilterAction('');
                                }}
                                variant="secondary"
                                className="w-full"
                            >
                                <X className="w-4 h-4" />
                                Limpar Filtros
                            </Button>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <span className="text-sm text-gray-600">
                            Mostrando <strong>{filteredLogs.length}</strong> de <strong>{logs.length}</strong> registros
                        </span>
                    </div>
                </Card>
            </div>

            {/* Lista de Logs */}
            <div className="space-y-3">
                {filteredLogs.length > 0 ? filteredLogs.map(log => (
                    <Card key={log.id}>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                                {getActionIcon(log.action)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            {getActionLabel(log.action)}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            <strong>{log.userName}</strong>
                                            {log.details?.rotinaNome && ` - ${log.details.rotinaNome}`}
                                            {log.details?.impressoraNome && ` - ${log.details.impressoraNome}`}
                                        </p>
                                        {log.details && Object.keys(log.details).length > 0 && (
                                            <div className="mt-2 text-xs text-gray-500">
                                                {log.details.comFoto && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full mr-2">
                                                        <Camera className="w-3 h-3" />
                                                        Com foto
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right text-xs text-gray-500">
                                        {log.timestamp && (
                                            <>
                                                <div>{log.timestamp.toDate().toLocaleDateString('pt-BR')}</div>
                                                <div>{log.timestamp.toDate().toLocaleTimeString('pt-BR')}</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )) : (
                    <Card>
                        <p className="text-center text-gray-600">Nenhum log encontrado com os filtros aplicados.</p>
                    </Card>
                )}
            </div>
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
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userData?.uid);
    const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
    
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
                return <DashboardPage routines={routines} executions={executions} setPage={setPage} users={users} />;
            case 'rotinas':
                return <RoutinesPage routines={routines} executions={executions} userData={userData} />;
            case 'historico':
                return <HistoryPage executions={executions} routines={routines} />;
            case 'impressoras':
                return <PrintersPage />;
            case 'estoque':
                return <StockPage userData={userData} />;
            case 'relatorios':
                return <ReportsPage executions={executions} routines={routines} users={users} />;
            case 'auto-reports':
                return <AutoReportsPage executions={executions} routines={routines} users={users} />;
            case 'logs':
                return hasPermission(userData?.tipo, 'canViewLogs') ? <ActivityLogsPage /> : <p className="text-center text-gray-600 py-8">Acesso negado. Apenas administradores podem visualizar logs.</p>;
            case 'admin':
                return userData.tipo === 'admin' ? <AdminPage routines={routines} users={users} /> : <p>Acesso negado.</p>;
            default:
                return <DashboardPage routines={routines} executions={executions} setPage={setPage} users={users} />;
        }
    };
    
    const navItems = [
        { name: 'Dashboard', icon: Home, page: 'dashboard' },
        { name: 'Rotinas', icon: ClipboardList, page: 'rotinas' },
        { name: 'Histórico', icon: History, page: 'historico' },
        { name: 'Impressoras', icon: Printer, page: 'impressoras' },
        { name: 'Estoque', icon: Package, page: 'estoque' },
        { name: 'Relatórios', icon: BarChart3, page: 'relatorios' },
        { name: 'Relatórios Auto', icon: FileCheck, page: 'auto-reports' },
    ];
    
    if (userData && userData.tipo === 'admin') {
        navItems.push({ name: 'Logs', icon: List, page: 'logs' });
        navItems.push({ name: 'Admin', icon: Settings, page: 'admin' });
    }

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar para Desktop */}
            <aside className="hidden md:flex w-64 flex-col bg-white border-r">
                <div className="h-16 flex items-center justify-center border-b px-4">
                    <Logo size="md" />
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
                {/* Header com Notificações */}
                <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            {navItems.find(item => item.page === page)?.name || 'Dashboard'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationBell 
                            unreadCount={unreadCount} 
                            onClick={() => setShowNotificationsPanel(true)} 
                        />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                                {userData.nome.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{userData.nome}</span>
                        </div>
                    </div>
                </header>
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6 md:p-8">
                    {renderPage()}
                </main>
            </div>
            
            {/* Painel de Notificações */}
            {showNotificationsPanel && (
                <NotificationsPanel
                    notifications={notifications}
                    unreadCount={unreadCount}
                    markAsRead={markAsRead}
                    markAllAsRead={markAllAsRead}
                    onClose={() => setShowNotificationsPanel(false)}
                />
            )}
            
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
