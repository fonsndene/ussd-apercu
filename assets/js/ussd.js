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

  /* --- Chiffres cles : compteurs qui defilent ----------------------------
     Le decompte demarre quand la rangee entre dans l'ecran, avec un decalage
     d'une cellule a l'autre. La valeur reelle est presente en clair dans le
     DOM pour les lecteurs d'ecran : seul l'affichage anime est masque, sinon
     un lecteur d'ecran annoncerait chaque increment.                        */
  var rangees = document.querySelectorAll(".stats");
  if (rangees.length) {
    var immobile = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function defiler(rangee) {
      rangee.classList.add("is-in");
      rangee.querySelectorAll(".stat__value[data-cible]").forEach(function (val, n) {
        var cible = parseInt(val.getAttribute("data-cible"), 10);
        var sortie = val.querySelector(".stat__num");
        if (isNaN(cible) || !sortie) { return; }
        if (immobile) { sortie.textContent = cible; return; }

        var duree = 1400, retard = n * 120, depart = null;
        function pas(t) {
          if (depart === null) { depart = t; }
          var e = t - depart - retard;
          if (e < 0) { requestAnimationFrame(pas); return; }
          var k = Math.min(1, e / duree);
          // sortie cubique : depart franc, arrivee posee
          var v = 1 - Math.pow(1 - k, 3);
          sortie.textContent = Math.round(cible * v);
          if (k < 1) { requestAnimationFrame(pas); }
        }
        requestAnimationFrame(pas);
      });
    }

    if (!immobile && "IntersectionObserver" in window) {
      var oStats = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (e) {
          if (e.isIntersecting) { defiler(e.target); oStats.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.3 });
      rangees.forEach(function (r) { oStats.observe(r); });
    } else {
      rangees.forEach(defiler);
    }
  }

  /* --- Le parcours : construction a l'entree dans l'ecran ----------------
     Le cadran des deux cursus et l'echelle annee par annee ne s'animent que
     lorsque la section arrive a l'ecran, et l'echelle rejoue a chaque
     changement de cursus : le visiteur voit le parcours se construire.    */
  var calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function construire(el) {
    if (!el) { return; }
    el.classList.remove("is-in");
    void el.offsetWidth;          // rearme les animations
    el.classList.add("is-in");
  }

  if (!calme && "IntersectionObserver" in window) {
    var oParcours = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) { construire(e.target); oParcours.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
    document.querySelectorAll(".cursus, .ladder").forEach(function (el) { oParcours.observe(el); });
  } else {
    document.querySelectorAll(".cursus, .ladder").forEach(function (el) { el.classList.add("is-in"); });
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
        var panneau = document.getElementById(t.getAttribute("aria-controls"));
        panneau.hidden = !on;
        // Le cursus qui apparait rejoue sa construction.
        if (on && !calme) { construire(panneau.querySelector(".ladder")); }
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

  /* --- Hero cinematique : trois actes -----------------------------------
     Chaque acte porte sa propre duree (data-duree) : 7 s, 8 s, 9 s. Le rythme
     ralentit vers la fin, et le dernier plan tient plus longtemps pour laisser
     le message s'imprimer.

     Conformite :
     - WCAG 2.2.2 : commande d'arret hors ecran, ramenee au premier focus
       clavier. Le survol et le focus suspendent aussi le defilement.
     - WCAG 2.1.1 : fleches gauche/droite, Debut et Fin quand le hero a le
       focus ; les reperes d'acte sont de vrais boutons.
     - Motif ARIA APG « carrousel » : la zone de service est muette pendant le
       defilement automatique et devient annoncante des que l'utilisateur
       prend la main.
     - prefers-reduced-motion : aucun defilement, aucune camera.            */
  var diapo = document.getElementById("diaporama");
  if (diapo) {
    var vue = document.getElementById("diapo-vue");
    var actes = Array.prototype.slice.call(diapo.querySelectorAll(".cine__slide"));
    var pas = Array.prototype.slice.call(diapo.querySelectorAll(".pas"));
    var btnPause = diapo.querySelector('[data-diapo="pause"]');
    var sobre = window.matchMedia("(prefers-reduced-motion: reduce)");

    var TITRES = ["qui sommes-nous", "ce que nous offrons", "quel avenir"];

    var i = 0;
    var auto = false;   // defilement automatique souhaite
    var gele = false;   // suspension passagere : survol, focus, onglet cache
    var tic = null;

    function duree(n) { return parseInt(actes[n].getAttribute("data-duree"), 10) || 7000; }

    function peindre() {
      actes.forEach(function (a, n) {
        var on = n === i;
        // On retire puis remet la classe pour rearmer camera et cascade.
        a.classList.toggle("is-active", on);
      });
      pas.forEach(function (p, n) {
        p.classList.remove("is-active", "is-vu");
        void p.offsetWidth;
        if (n < i) { p.classList.add("is-vu"); }
        if (n === i) {
          p.style.setProperty("--duree", duree(i) + "ms");
          p.classList.add("is-active");
        }
        p.setAttribute("aria-current", n === i ? "true" : "false");
      });
      vue.textContent = "Acte " + (i + 1) + " sur " + actes.length + " : " + TITRES[i] + ".";
    }

    function aller(n) { i = (n + actes.length) % actes.length; peindre(); }

    function rythme() {
      if (tic) { clearTimeout(tic); tic = null; }
      var actif = auto && !gele;
      diapo.setAttribute("data-pause", String(!actif));
      vue.setAttribute("aria-live", actif ? "off" : "polite");
      // setTimeout et non setInterval : la duree change d'un acte a l'autre.
      if (actif) {
        tic = setTimeout(function () { aller(i + 1); rythme(); }, duree(i));
      }
    }

    function majBouton() {
      btnPause.setAttribute("aria-label",
        auto ? "Arrêter le défilement automatique" : "Reprendre le défilement automatique");
      btnPause.textContent = auto ? "Arrêter le défilement" : "Reprendre le défilement";
    }

    pas.forEach(function (p, n) {
      p.addEventListener("click", function () { aller(n); rythme(); });
    });
    btnPause.addEventListener("click", function () { auto = !auto; majBouton(); rythme(); });

    diapo.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowLeft") n = i - 1;
      if (e.key === "ArrowRight") n = i + 1;
      if (e.key === "Home") n = 0;
      if (e.key === "End") n = actes.length - 1;
      if (n !== null) { e.preventDefault(); aller(n); rythme(); }
    });

    function suspendre(etat) { gele = etat; rythme(); }
    diapo.addEventListener("mouseenter", function () { suspendre(true); });
    diapo.addEventListener("mouseleave", function () { suspendre(false); });
    diapo.addEventListener("focusin", function () { suspendre(true); });
    diapo.addEventListener("focusout", function () { suspendre(false); });
    document.addEventListener("visibilitychange", function () { suspendre(document.hidden); });

    sobre.addEventListener("change", function () {
      auto = !sobre.matches;
      majBouton();
      rythme();
    });

    auto = !sobre.matches;   // pas de defilement si le systeme demande le calme
    majBouton();
    peindre();
    rythme();
  }

  /* --- Plan d'acces : chargement a la demande ----------------------------
     openstreetmap.org n'est appele que si le visiteur clique. Avant cela,
     aucune requete vers un tiers, et la page reste legere.                 */
  var carte = document.getElementById("carte");
  if (carte) {
    var voirCarte = carte.querySelector('[data-carte="afficher"]');
    if (voirCarte) {
      voirCarte.addEventListener("click", function () {
        var cadre = document.createElement("iframe");
        cadre.src = carte.getAttribute("data-src");
        cadre.title = "Plan d'accès au campus de l'USSD, Point E à Dakar";
        cadre.loading = "lazy";
        cadre.setAttribute("referrerpolicy", "no-referrer");
        carte.appendChild(cadre);
        carte.classList.add("is-chargee");
      });
    }
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
