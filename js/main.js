// Aromatic Coffee — interacciones mínimas, sin librerías.
(() => {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');

  const pintar = () => nav.classList.toggle('solida', window.scrollY > 10);
  pintar();
  window.addEventListener('scroll', pintar, { passive: true });

  const cerrar = () => {
    menu.classList.remove('abierto');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
  };
  burger.addEventListener('click', () => {
    const abierto = menu.classList.toggle('abierto');
    burger.setAttribute('aria-expanded', String(abierto));
    burger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });
  menu.querySelectorAll('a, button').forEach((a) => a.addEventListener('click', cerrar));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && cerrar());

  // Pestañas del menú
  const tabs = document.querySelectorAll('[data-cat][role="tab"]');
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    document.querySelectorAll('#drinks li').forEach((li) => { li.hidden = li.dataset.cat !== tab.dataset.cat; });
  }));

  // ===== Cafesito: asistente por reglas (sin servidor) =====
  // Número de WhatsApp para confirmar pedidos (código de país + número, sin + ni espacios)
  const WHATSAPP = '50200000000';
  const MENU = {
    'Espresso': 15, 'Americano': 18, 'Cappuccino': 25, 'Latte de vainilla': 28, 'Chocolate guatemalteco': 22,
    'Café de olla': 20, 'Cold brew': 26, 'Iced latte': 27, 'Frappé de caramelo': 32, 'Espresso tonic': 29,
  };
  const chat = document.getElementById('chat');
  const msgs = document.getElementById('chat-msgs');
  const quick = document.getElementById('chat-quick');
  const input = document.getElementById('chat-input');
  let pedido = null;

  const sinTildes = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const decir = (texto, quien = 'bot') => {
    const p = document.createElement('p');
    p.className = `msg ${quien} visto`;
    p.textContent = texto;
    msgs.appendChild(p);
    msgs.scrollTop = msgs.scrollHeight;
  };
  const opciones = (lista) => {
    quick.innerHTML = '';
    lista.forEach((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o;
      b.addEventListener('click', () => recibir(o));
      quick.appendChild(b);
    });
  };
  const responder = (texto, ops) => setTimeout(() => { decir(texto); if (ops) opciones(ops); }, 450);
  const INICIO = ['Ver menú', 'Recomendame algo', 'Horario', 'Hacer un pedido'];

  function recibir(texto) {
    decir(texto, 'me');
    opciones([]);
    const t = sinTildes(texto);
    const bebida = Object.keys(MENU).find((m) => t.includes(sinTildes(m)));

    if (pedido === 'eligiendo' && bebida) {
      pedido = bebida;
      return responder(`¡Buena elección! ${bebida} cuesta Q${MENU[bebida]}. ¿Te lo confirmo por WhatsApp para que pases a recogerlo?`, ['Sí, confirmar', 'Elegir otra']);
    }
    if (typeof pedido === 'string' && pedido !== 'eligiendo' && /^si|confirm/.test(t)) {
      const enlace = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, quiero pedir un ${pedido} para llevar.`)}`;
      window.open(enlace, '_blank', 'noopener');
      pedido = null;
      return responder('Te abrí WhatsApp con tu pedido listo. ¡Tu café estará en unos 5 minutos! ☕', INICIO);
    }
    if (/menu|carta|precio|bebida/.test(t)) {
      return responder('Calientes: espresso Q15, americano Q18, cappuccino Q25, latte de vainilla Q28, chocolate Q22, café de olla Q20. Frías: cold brew Q26, iced latte Q27, frappé de caramelo Q32, espresso tonic Q29.', ['Recomendame algo', 'Hacer un pedido']);
    }
    if (/recomend|sugier|que tomo|antoj/.test(t)) {
      return responder('Si querés algo suave y dulce, el latte de vainilla. Si preferís algo frío sin azúcar, el cold brew. Y si sos de café fuerte, un espresso doble.', ['Latte de vainilla', 'Cold brew', 'Espresso']);
    }
    if (/horario|hora|abierto|abren|cierran/.test(t)) {
      return responder('Abrimos de lunes a viernes de 6:30 a 20:00, sábados de 7:00 a 21:00 y domingos de 8:00 a 18:00. Estamos en zona 10.', ['Hacer un pedido', 'Ver menú']);
    }
    if (/donde|ubicacion|direccion|zona/.test(t)) {
      return responder('Estamos en zona 10, Ciudad de Guatemala. ¿Querés pedir para recoger?', ['Hacer un pedido']);
    }
    if (/pedir|pedido|ordenar|quiero/.test(t) || bebida) {
      if (bebida) { pedido = bebida; return responder(`¡Buena elección! ${bebida} cuesta Q${MENU[bebida]}. ¿Te lo confirmo por WhatsApp para que pases a recogerlo?`, ['Sí, confirmar', 'Elegir otra']); }
      pedido = 'eligiendo';
      return responder('¡Dale! ¿Qué bebida querés?', ['Latte de vainilla', 'Cappuccino', 'Cold brew', 'Americano']);
    }
    if (/otra/.test(t)) { pedido = 'eligiendo'; return responder('Sin problema, ¿cuál querés?', ['Cappuccino', 'Iced latte', 'Frappé de caramelo']); }
    if (/hola|buenas|hey/.test(t)) return responder('¡Hola! ¿En qué te ayudo?', INICIO);
    if (/gracias/.test(t)) return responder('¡Con gusto! Que disfrutés tu café ☕', INICIO);
    return responder('Todavía estoy aprendiendo 😅. Puedo mostrarte el menú, recomendarte algo, darte el horario o tomar tu pedido.', INICIO);
  }

  let saludado = false;
  const abrirChat = () => {
    chat.hidden = false;
    document.body.classList.add('chat-abierto');
    if (!saludado) {
      saludado = true;
      decir('¡Hola! Soy Cafesito ☕ Te ayudo a elegir tu bebida y a pedirla para llevar.');
      opciones(INICIO);
    }
    setTimeout(() => input.focus(), 50);
  };
  const cerrarChat = () => { chat.hidden = true; document.body.classList.remove('chat-abierto'); };
  document.getElementById('chat-cerrar').addEventListener('click', cerrarChat);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !chat.hidden) cerrarChat(); });
  document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = input.value.trim();
    if (!t) return;
    input.value = '';
    recibir(t);
  });
  document.querySelectorAll('[data-chat]').forEach((b) => b.addEventListener('click', abrirChat));

  // Aparecer al hacer scroll
  const items = document.querySelectorAll('.reveal');
  const verMensajes = () => {
    document.querySelectorAll('.msg').forEach((m, i) => setTimeout(() => m.classList.add('visto'), 350 + i * 650));
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      if (e.target.classList.contains('phone')) verMensajes();
      io.unobserve(e.target);
    }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 80}ms`; io.observe(el); });
  } else {
    items.forEach((el) => el.classList.add('visible'));
    verMensajes();
  }

  document.getElementById('anio').textContent = new Date().getFullYear();
})();
