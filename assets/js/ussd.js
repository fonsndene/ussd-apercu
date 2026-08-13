/* USSD — comportements front. Sans dépendance, chargé en defer.
   Chaque bloc s'auto-désactive si son point d'ancrage est absent de la page. */
(function () {
  "use strict";

  /* --- Navigation mobile ------------------------------------------------ */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav-principal");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.querySelector(".nav-toggle__text").textContent = open ? "Menu" : "Fermer";
    });
  }

  /* --- Signature : onglets du parcours ---------------------------------- */
  var tablist = document.querySelector('[role="tablist"][data-tabs="parcours"]');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  }

  /* --- Simulateur de frais de scolarité --------------------------------- */
  var sim = document.getElementById("simulateur");
  if (sim) {
    // Tarifs publiés pour l'année académique en cours (source : USSD).
    var TARIF = { inscription: 120000, mensualite: 280000, mois: 10 };
    var DUREE = { medecine: 8, pharmacie: 6 };

    var fmt = new Intl.NumberFormat("fr-FR");
    function money(n) { return fmt.format(n) + " F CFA"; }

    function calcul() {
      var filiere = sim.querySelector("#sim-filiere").value;
      var mode = sim.querySelector("#sim-mode").value;
      var annees = DUREE[filiere];
      var scolarite = TARIF.mensualite * TARIF.mois;
      var annuel = TARIF.inscription + scolarite;

      sim.querySelector("#out-duree").textContent = annees + " ans";
      sim.querySelector("#out-inscription").textContent = money(TARIF.inscription);
      sim.querySelector("#out-scolarite").textContent =
        mode === "mensuel"
          ? money(TARIF.mensualite) + " × " + TARIF.mois + " mois"
          : money(scolarite) + " en une fois";
      sim.querySelector("#out-annuel").textContent = money(annuel);
      sim.querySelector("#out-total").textContent = money(annuel * annees);
    }

    sim.addEventListener("change", calcul);
    sim.addEventListener("input", calcul);
    calcul();
  }

  /* --- Formulaire de pré-inscription ------------------------------------
     Validation côté client uniquement : aucun back-end n'est branché.
     Le point de soumission réel reste à connecter (voir README).          */
  var form = document.getElementById("form-preinscription");
  if (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        status.setAttribute("data-state", "err");
        status.textContent = "Vérifiez les champs signalés avant d'envoyer votre dossier.";
        return;
      }
      status.setAttribute("data-state", "err");
      status.textContent =
        "Ce formulaire n'est pas encore relié au service des admissions. " +
        "En attendant, envoyez votre dossier PDF à contact@universitesciencesante.com " +
        "ou par WhatsApp au +221 77 569 70 10.";
    });
  }

  /* --- Diaporama du hero -------------------------------------------------
     Trois photographies, fondu enchaîné, 4 s par image.

     Conformité :
     - WCAG 2.2.2 « Pause, Stop, Hide » : la commande d'arrêt est hors écran
       et revient au premier focus clavier, comme le lien d'évitement. Les
       boutons de lecture visibles ont été retirés à la demande du client ;
       l'affordance d'arrêt, elle, reste obligatoire.
     - WCAG 2.1.1 : flèches ←/→, Début et Fin quand le diaporama a le focus ;
       toutes les commandes sont de vrais boutons, atteignables au Tab.
     - Motif ARIA APG « carrousel » : la zone d'images est en aria-live="off"
       pendant le défilement automatique, et bascule en "polite" dès que
       l'utilisateur prend la main — sinon un lecteur d'écran serait
       interrompu toutes les six secondes.
     - prefers-reduced-motion : aucun défilement automatique.               */
  var diapo = document.getElementById("diaporama");
  if (diapo) {
    var DUREE = 4000;
    var vue = document.getElementById("diapo-vue");
    var vues = Array.prototype.slice.call(diapo.querySelectorAll(".diapo__slide"));
    var pas = Array.prototype.slice.call(diapo.querySelectorAll(".pas"));
    var btnPause = diapo.querySelector('[data-diapo="pause"]');
    var sobre = window.matchMedia("(prefers-reduced-motion: reduce)");

    var LEGENDES = ["arriver", "se former", "devenir"];

    var i = 0;          // image affichée
    var auto = false;   // défilement automatique souhaité
    var gele = false;   // suspension passagère : survol, focus, onglet caché
    var tic = null;

    function peindre() {
      vues.forEach(function (v, n) { v.classList.toggle("is-active", n === i); });
      pas.forEach(function (p, n) {
        p.classList.remove("is-active", "is-vu");
        // on réarme l'animation de remplissage du segment
        void p.offsetWidth;
        if (n < i) { p.classList.add("is-vu"); }
        if (n === i) { p.classList.add("is-active"); }
        p.setAttribute("aria-current", n === i ? "true" : "false");
      });
      // Plus de legende visible : on annonce le changement aux lecteurs d'ecran.
      vue.textContent = "Image " + (i + 1) + " sur " + vues.length + " : " + LEGENDES[i] + ".";
    }

    function aller(n) { i = (n + vues.length) % vues.length; peindre(); }

    function rythme() {
      if (tic) { clearInterval(tic); tic = null; }
      var actif = auto && !gele;
      diapo.setAttribute("data-pause", String(!actif));
      // Pendant le défilement automatique, on n'annonce rien : l'utilisateur
      // n'a pas demandé ces changements. Dès qu'il pilote, on annonce.
      vue.setAttribute("aria-live", actif ? "off" : "polite");
      if (actif) { tic = setInterval(function () { aller(i + 1); }, DUREE); }
    }

    function majBouton() {
      btnPause.setAttribute("aria-label",
        auto ? "Arrêter le défilement automatique" : "Reprendre le défilement automatique");
    }

    // Commandes
    pas.forEach(function (p, n) {
      p.addEventListener("click", function () { aller(n); rythme(); });
    });
    btnPause.addEventListener("click", function () {
      auto = !auto;
      majBouton();
      rythme();
    });

    // Clavier
    diapo.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowLeft") n = i - 1;
      else if (e.key === "ArrowRight") n = i + 1;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = vues.length - 1;
      if (n === null) return;
      e.preventDefault();
      aller(n);
      rythme();
    });

    // Suspensions passagères
    function geler(etat) { gele = etat; rythme(); }
    diapo.addEventListener("mouseenter", function () { geler(true); });
    diapo.addEventListener("mouseleave", function () { geler(false); });
    diapo.addEventListener("focusin", function () { geler(true); });
    diapo.addEventListener("focusout", function () { geler(false); });
    document.addEventListener("visibilitychange", function () { geler(document.hidden); });

    function demarrer() {
      auto = !sobre.matches;
      majBouton();
      rythme();
    }
    sobre.addEventListener("change", demarrer);

    peindre();
    demarrer();
  }

  /* --- Connexion à l'espace numérique -----------------------------------
     Aucun service d'authentification n'est branché. Le formulaire valide la
     saisie puis oriente vers la scolarité. Ne jamais transmettre d'identifiant
     tant qu'un point d'authentification en HTTPS n'est pas en place.        */
  var login = document.getElementById("form-connexion");
  if (login) {
    var loginStatus = login.querySelector(".form-status");
    login.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!login.checkValidity()) {
        login.reportValidity();
        loginStatus.setAttribute("data-state", "err");
        loginStatus.textContent = "Renseignez votre identifiant et votre mot de passe.";
        return;
      }
      login.querySelector("#motdepasse").value = "";
      loginStatus.setAttribute("data-state", "err");
      loginStatus.textContent =
        "L'espace numérique n'est pas encore ouvert. Pour obtenir vos accès, " +
        "contactez la scolarité au +221 33 859 01 31.";
    });
  }

  /* --- Bandeau cookies : opt-in strict ----------------------------------
     Aucun traceur n'est chargé par défaut. Le choix est mémorisé en local. */
  var cookie = document.getElementById("cookie-banner");
  if (cookie) {
    var KEY = "ussd-consentement";
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (err) { stored = "indisponible"; }
    if (!stored) cookie.hidden = false;

    cookie.addEventListener("click", function (e) {
      var choix = e.target.getAttribute && e.target.getAttribute("data-consent");
      if (!choix) return;
      try { localStorage.setItem(KEY, choix); } catch (err) { /* stockage bloqué : on ferme sans mémoriser */ }
      cookie.hidden = true;
    });
  }

  /* --- Révélation au défilement (discrète, respecte reduced-motion) ----- */
  var cibles = document.querySelectorAll(".reveal");
  var calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (cibles.length && !calme && "IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); obs.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    cibles.forEach(function (el) { obs.observe(el); });
  } else {
    cibles.forEach(function (el) { el.classList.add("is-in"); });
  }
})();
