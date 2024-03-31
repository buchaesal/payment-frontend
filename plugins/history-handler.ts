const handleBack = (event: any) => {
  // event.state에 scroll position이 있음
  console.log(
    '뒤로 가기 버튼을 눌렀습니다.',
    event,
    'scrollY: ',
    event.state.scroll.top,
  );
};
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:start', () => {
    console.log('page:start hooks');
    // window.removeEventListener('popstate', handleBack);
    window.addEventListener('popstate', handleBack);
  });
});
