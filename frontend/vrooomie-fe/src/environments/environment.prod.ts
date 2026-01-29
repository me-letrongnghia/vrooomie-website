// Production environment (Docker/VPS)
export const environment = {
    production: true,
    // Use relative URLs - nginx will proxy to backend
    // This works for both local Docker and VPS deployment
    baseUrl: '/api',
    frontendUrl: window.location.origin,
    oauth2Url: '/oauth2/authorization'
};
