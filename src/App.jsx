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
    BarChart3,
    PieChart,
    Activity
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

    }, [user]);

    return { userData, loading };
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
            src="/hpaes.png" 
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

// Hook para notificações
const useNotifications = (routines, executions) => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const checkNotifications = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startOfToday = Timestamp.fromDate(today);

            const newNotifications = [];
            const completedTodayIds = new Set(
                executions
                    .filter(e => e.dataHora >= startOfToday)
                    .map(e => e.rotinaId)
            );

            // Verificar rotinas diárias pendentes
            const dailyRoutines = routines.filter(r => r.frequencia === 'diaria');
            const pendingDaily = dailyRoutines.filter(r => !completedTodayIds.has(r.id));

            if (pendingDaily.length > 0) {
                newNotifications.push({
                    id: 'daily-pending',
                    type: 'warning',
                    title: 'Rotinas Diárias Pendentes',
                    message: `Você tem ${pendingDaily.length} rotina(s) diária(s) pendente(s).`,
                    timestamp: new Date()
                });
            }

            // Verificar rotinas de alta prioridade
            const highPriority = pendingDaily.filter(r => r.prioridade === 'alta');
            if (highPriority.length > 0) {
                newNotifications.push({
                    id: 'high-priority',
                    type: 'error',
                    title: 'Atenção: Rotinas Críticas!',
                    message: `${highPriority.length} rotina(s) de alta prioridade precisa(m) de atenção.`,
                    timestamp: new Date()
                });
            }

            setNotifications(newNotifications);
        };

        checkNotifications();
        const interval = setInterval(checkNotifications, 60000); // Verificar a cada minuto

        return () => clearInterval(interval);
    }, [routines, executions]);

    return notifications;
};

// Componente de Notificações
const NotificationBell = ({ notifications }) => {
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <div className="relative">
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell className="w-6 h-6" />
                {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
            </button>

            {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold text-gray-800">Notificações</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div key={notif.id} className={`p-4 border-b hover:bg-gray-50 ${
                                    notif.type === 'error' ? 'bg-red-50' : 
                                    notif.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                            notif.type === 'error' ? 'text-red-600' : 
                                            notif.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                                        }`} />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-sm text-gray-800">{notif.title}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>Nenhuma notificação</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
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

                return dateMatch && dateEndMatch && userMatch && categoryMatch && routineMatch;
            })
            .sort((a, b) => b.dataHora.toMillis() - a.dataHora.toMillis());
    }, [executions, filterDate, filterDateEnd, filterUser, filterCategory, filterRoutine, routinesMap]);

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
        checklist: []
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
            checklist: []
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
            checklist: routine.checklist || []
        });
        setChecklistInput('');
        setIsModalOpen(true);
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

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleFormSubmit}>Salvar Rotina</Button>
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

    const notifications = useNotifications(routines, executions);

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
    ];
    
    if (userData && userData.tipo === 'admin') {
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
                        <NotificationBell notifications={notifications} />
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
