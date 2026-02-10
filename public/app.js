// 初始化 PocketBase 客户端
const pb = new PocketBase('http://127.0.0.1:8090');

// DOM 元素
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authMessage = document.getElementById('auth-message');
const tasksContainer = document.getElementById('tasks-container');

// 当前用户和任务状态
let currentUser = null;
let currentFilter = 'all';

// 初始化应用
function initApp() {
    // 检查是否已登录
    if (pb.authStore.isValid) {
        currentUser = pb.authStore.model;
        showApp();
        loadTasks();
        setupRealtime();
    } else {
        showAuth();
    }
}

// 显示认证界面
function showAuth() {
    authSection.style.display = 'block';
    appSection.style.display = 'none';
}

// 显示应用界面
function showApp() {
    authSection.style.display = 'none';
    appSection.style.display = 'block';
}

// 显示登录表单
function showLogin() {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab')[0].classList.add('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
}

// 显示注册表单
function showRegister() {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab')[1].classList.add('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
}

// 登录
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const authData = await pb.collection('users').authWithPassword(email, password);
        currentUser = authData.record;
        showApp();
        loadTasks();
        setupRealtime();
        showMessage('登录成功！', 'success');
    } catch (error) {
        showMessage('登录失败：' + error.message, 'error');
    }
});

// 注册
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-passwordConfirm').value;
    
    if (password !== passwordConfirm) {
        showMessage('两次输入的密码不一致', 'error');
        return;
    }
    
    try {
        const data = {
            email: email,
            password: password,
            passwordConfirm: passwordConfirm,
            emailVisibility: false
        };
        
        await pb.collection('users').create(data);
        showMessage('注册成功！请登录', 'success');
        showLogin();
        registerForm.reset();
    } catch (error) {
        showMessage('注册失败：' + error.message, 'error');
    }
});

// 退出登录
async function logout() {
    pb.authStore.clear();
    currentUser = null;
    showAuth();
    showMessage('已退出登录', 'success');
}

// 显示消息
function showMessage(text, type) {
    authMessage.textContent = text;
    authMessage.className = `message ${type}`;
    setTimeout(() => {
        authMessage.style.display = 'none';
    }, 3000);
}

// 加载任务
async function loadTasks() {
    tasksContainer.innerHTML = '<div class="loading">加载中...</div>';
    
    try {
        const filter = getFilterQuery();
        const tasks = await pb.collection('tasks').getFullList({
            filter: filter,
            sort: '-created'
        });
        
        renderTasks(tasks);
    } catch (error) {
        tasksContainer.innerHTML = `<div class="error">加载失败：${error.message}</div>`;
    }
}

// 获取过滤条件
function getFilterQuery() {
    let filter = `user = "${currentUser.id}"`;
    
    if (currentFilter === 'pending') {
        filter += ' && completed = false';
    } else if (currentFilter === 'completed') {
        filter += ' && completed = true';
    }
    
    return filter;
}

// 渲染任务列表
function renderTasks(tasks) {
    if (tasks.length === 0) {
        tasksContainer.innerHTML = '<div class="empty">暂无任务</div>';
        return;
    }
    
    tasksContainer.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <div class="task-actions">
                    ${!task.completed ? 
                        `<button onclick="toggleTask('${task.id}')" class="task-btn btn-complete">
                            <i class="fas fa-check"></i> 完成
                        </button>` : 
                        `<button onclick="toggleTask('${task.id}')" class="task-btn" style="background: #6c757d">
                            <i class="fas fa-undo"></i> 撤销
                        </button>`
                    }
                    <button onclick="deleteTask('${task.id}')" class="task-btn btn-delete">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
            <div class="task-description">${task.description || '无描述'}</div>
            <div class="task-meta">
                <div>创建：${new Date(task.created).toLocaleDateString()}</div>
                ${task.due_date ? 
                    `<div>截止：${new Date(task.due_date).toLocaleDateString()}</div>` : 
                    `<div>无截止日期</div>`
                }
            </div>
        </div>
    `).join('');
}

// 过滤任务
function filterTasks(filter) {
    currentFilter = filter;
    document.querySelectorAll('.task-filters button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    loadTasks();
}

// 添加任务
async function addTask() {
    const title = document.getElementById('new-task-title').value;
    const description = document.getElementById('new-task-description').value;
    const dueDate = document.getElementById('new-task-due').value;
    
    if (!title.trim()) {
        alert('请输入任务标题');
        return;
    }
    
    try {
        const data = {
            title: title,
            description: description,
            user: currentUser.id,
            completed: false
        };
        
        if (dueDate) {
            data.due_date = dueDate;
        }
        
        await pb.collection('tasks').create(data);
        
        // 清空输入框
        document.getElementById('new-task-title').value = '';
        document.getElementById('new-task-description').value = '';
        document.getElementById('new-task-due').value = '';
        
        loadTasks();
    } catch (error) {
        alert('添加失败：' + error.message);
    }
}

// 切换任务状态
async function toggleTask(taskId) {
    try {
        const task = await pb.collection('tasks').getOne(taskId);
        await pb.collection('tasks').update(taskId, {
            completed: !task.completed
        });
        loadTasks();
    } catch (error) {
        alert('操作失败：' + error.message);
    }
}

// 删除任务
async function deleteTask(taskId) {
    if (!confirm('确定要删除这个任务吗？')) return;
    
    try {
        await pb.collection('tasks').delete(taskId);
        loadTasks();
    } catch (error) {
        alert('删除失败：' + error.message);
    }
}

// 设置实时订阅
function setupRealtime() {
    // 取消之前的订阅
    pb.collection('tasks').unsubscribe('*');
    
    // 订阅任务集合的变更
    pb.collection('tasks').subscribe('*', function (e) {
        // 只处理当前用户的任务
        if (e.record.user === currentUser.id) {
            loadTasks();
        }
    });
}

// 页面加载时初始化应用
document.addEventListener('DOMContentLoaded', initApp);