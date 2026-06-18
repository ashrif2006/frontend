
const BASE_URL = 'http://localhost:3000/api';


function getHeader(){
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}
export async function loginAPI(email , password) {
    try{
        const response = await fetch(`${BASE_URL}/auth/login`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        } );
        const data = await response.json();
        console.log(response.ok ,data);
        return {ok:response.ok , data: data};
    }catch(error){
        console.log("fetch error",error)
    }
}

export async function registerAPI(ownerData){
    const response = await fetch(`${BASE_URL}/auth/register`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(ownerData)
    });
    const data = await response.json();
    console.log(data);
    return {ok:response.ok , data:data};
}



