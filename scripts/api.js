// 测试API连接
async function testApiConnection() {
    try {
        const response = await fetch('http://localhost:3008/ping', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Response-Type': 'application/json'
            },
        });
        const data = await response.json();
        console.log('API test response:', data);
    } catch (error) {
        console.error('API test error:', error);
        alert('API test error:', error);
    }
}

// 调用beautify接口
async function callBeautifyApi(prompt, siteConfig, needCreatePage = true) {
    try {
        console.log('Calling beautify API with:', { prompt, siteConfig, needCreatePage });
        const response = await fetch('http://localhost:3008/beautify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                siteConfig,
                needCreatePage
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Beautify API response:', data);
        return data;
    } catch (error) {
        console.error('Beautify API error:', error);
        throw error;
    }
}

// 页面加载完成后执行测试
document.addEventListener('DOMContentLoaded', testApiConnection);