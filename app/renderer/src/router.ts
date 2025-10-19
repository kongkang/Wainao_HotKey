import { createRouter, createWebHashHistory } from 'vue-router';
import OverlayPanel from '@components/OverlayPanel.vue';
import StableWindow from '@views/StableWindow.vue';
import DemoLanding from '@views/DemoLanding.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: DemoLanding },
    { path: '/overlay', component: OverlayPanel },
    { path: '/stable', component: StableWindow }
  ]
});
