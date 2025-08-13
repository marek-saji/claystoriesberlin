const searchParams = new URLSearchParams(window.location.search);
const dev =
    (searchParams.get('dev') ?? localStorage.getItem('dev')) === 'true'
    || Array.from(document.getElementsByTagName('script')).some(s => s.src.includes('/.11ty/'));

if (dev) {
    const { accented } = await import('https://esm.sh/accented');
    accented()
}
