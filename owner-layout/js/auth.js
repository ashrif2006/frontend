import {loginAPI, registerAPI} from './api.js';

export async function handleLogin(email , password) {
    try{
        const result = await loginAPI(email , password);
        if(result.ok){
            console.log(result.data.token)
            localStorage.setItem('token',result.data.token);
            return { success: true  };

        }
        else{
            return {success:false , message:result.data.message || "البيانات غير صحيحه "}
        }
    }catch(error){
        console.error('Login error:', error);
        return { success: false, message: 'Login failed' };
    }
}

export async function handleRegister(ownerData){
    try{
        const result = await registerAPI(ownerData);
        if(result.ok){
            return { success: true  };
        }
        return {
            success:false,
            message : result.data?.message || "لا يمكن تسجيل الدخول"
        }
    }catch(error){
        console.error('Register error:', error);
        return { success: false, message: 'Register failed' };
    }
}

export function logout() {
    localStorage.removeItem('token');
}