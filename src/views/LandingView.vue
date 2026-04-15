<template>
  <div class="landing-page">
    <div class="landing-notice">{{ t('landing.topNotice') }}</div>

    <header class="landing-nav">
      <div class="brand-wrap">
        <span class="brand-logo">▮▮</span>
        <strong>{{ t('common.brand') }}</strong>
      </div>

      <nav class="landing-links">
        <a href="#features">{{ t('landing.navFeatures') }}</a>
        <a href="#analysis">{{ t('landing.navLayout') }}</a>
        <a href="#cta">{{ t('landing.navCommunity') }}</a>
      </nav>

      <div class="landing-actions">
        <button :class="['lang-chip', { active: locale === 'zh' }]" @click="setLang('zh')">{{ t('common.chinese') }}</button>
        <button :class="['lang-chip', { active: locale === 'en' }]" @click="setLang('en')">{{ t('common.english') }}</button>
        <template v-if="isAuthenticated">
          <el-button type="primary" @click="goBoards">{{ t('auth.enterBoards') }}</el-button>
        </template>
        <template v-else>
          <el-button text @click="goLogin">{{ t('auth.login') }}</el-button>
          <el-button type="primary" @click="goLogin">{{ t('auth.signup') }}</el-button>
        </template>
      </div>
    </header>

    <section class="hero-section">
      <div class="hero-copy">
        <h1>{{ t('landing.heroTitle') }}</h1>
        <p>{{ t('landing.heroSubtitle') }}</p>

        <div class="hero-cta">
          <el-button type="primary" size="large" @click="goLogin">{{ t('landing.startNow') }}</el-button>
          <el-button size="large" @click="scrollToFeatures">{{ t('landing.watchDemo') }}</el-button>
        </div>

        <div class="hero-stats">
          <article>
            <strong>3.2M+</strong>
            <span>{{ t('landing.statBoards') }}</span>
          </article>
          <article>
            <strong>98M+</strong>
            <span>{{ t('landing.statCards') }}</span>
          </article>
          <article>
            <strong>120K+</strong>
            <span>{{ t('landing.statAutomations') }}</span>
          </article>
        </div>
      </div>

      <div class="hero-visual" aria-hidden="true">
        <div class="mock-board">
          <header>
            <span></span>
            <span></span>
            <span></span>
          </header>
          <div class="mock-columns">
            <div v-for="column in 3" :key="column" class="mock-column">
              <div class="mock-card" v-for="card in 3" :key="card"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="features" class="feature-section">
      <header>
        <h2>{{ t('landing.sectionTitle') }}</h2>
        <p>{{ t('landing.sectionSub') }}</p>
      </header>

      <div class="feature-grid">
        <article>
          <h3>{{ t('landing.feature1Title') }}</h3>
          <p>{{ t('landing.feature1Desc') }}</p>
        </article>
        <article>
          <h3>{{ t('landing.feature2Title') }}</h3>
          <p>{{ t('landing.feature2Desc') }}</p>
        </article>
        <article>
          <h3>{{ t('landing.feature3Title') }}</h3>
          <p>{{ t('landing.feature3Desc') }}</p>
        </article>
      </div>
    </section>

    <section id="analysis" class="analysis-section">
      <h2>{{ t('analysis.title') }}</h2>
      <ul>
        <li>{{ t('analysis.overall') }}</li>
        <li>{{ t('analysis.nav') }}</li>
        <li>{{ t('analysis.hero') }}</li>
        <li>{{ t('analysis.features') }}</li>
        <li>{{ t('analysis.cta') }}</li>
        <li>{{ t('analysis.application') }}</li>
      </ul>
    </section>

    <section id="cta" class="landing-cta">
      <h2>{{ t('landing.ctaTitle') }}</h2>
      <p>{{ t('landing.ctaSub') }}</p>
      <el-button type="primary" size="large" @click="goLogin">{{ t('landing.ctaButton') }}</el-button>
    </section>

    <footer class="landing-footer">
      <span>{{ t('landing.footerCopyright') }}</span>
      <span>{{ t('landing.footerBuilt') }}</span>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const t = userStore.t
const locale = computed(() => userStore.locale)
const isAuthenticated = computed(() => userStore.isAuthenticated)

function goLogin() {
  if (userStore.isAuthenticated) {
    router.push({ name: 'workspace' })
    return
  }

  router.push({ name: 'login' })
}

function goBoards() {
  router.push({ name: 'workspace' })
}

function setLang(nextLocale) {
  userStore.setLocale(nextLocale)
}

function scrollToFeatures() {
  const section = document.getElementById('features')
  section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f6f8fc 0%, #eef3fb 100%);
  color: #1c314f;
}

.landing-notice {
  text-align: center;
  font-size: 13px;
  padding: 8px 14px;
  background: #0052d9;
  color: #ffffff;
}

.landing-nav {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 14px 20px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
}

.brand-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
}

.brand-logo {
  display: inline-flex;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
  background: #1655c8;
  color: #ffffff;
  font-size: 10px;
  letter-spacing: -1px;
}

.landing-links {
  justify-self: center;
  display: inline-flex;
  gap: 20px;
}

.landing-links a {
  color: #405b82;
  text-decoration: none;
  font-weight: 500;
}

.landing-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.lang-chip {
  border: 1px solid #d4e1f2;
  background: #ffffff;
  color: #34567f;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
}

.lang-chip.active {
  background: #0d63e7;
  color: #ffffff;
  border-color: #0d63e7;
}

.hero-section {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 36px 20px 20px;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(320px, 1fr);
  gap: 26px;
  align-items: center;
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 54px);
  line-height: 1.1;
  color: #163d76;
}

.hero-copy p {
  margin: 14px 0 0;
  color: #4e6487;
  font-size: 18px;
  line-height: 1.6;
  max-width: 560px;
}

.hero-cta {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-stats {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.hero-stats article {
  border: 1px solid #d7e1f0;
  background: #ffffff;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.hero-stats strong {
  display: block;
  font-size: 20px;
  color: #184b91;
}

.hero-stats span {
  font-size: 12px;
  color: #587096;
}

.hero-visual {
  display: flex;
  justify-content: center;
}

.mock-board {
  width: min(540px, 100%);
  border: 1px solid #d6e2f2;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 20px 40px rgba(18, 57, 103, 0.1);
  padding: 14px;
}

.mock-board header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.mock-board header span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d8e4f5;
}

.mock-columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.mock-column {
  border: 1px dashed #d4deeb;
  border-radius: 10px;
  min-height: 210px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mock-card {
  height: 44px;
  border-radius: 8px;
  background: linear-gradient(90deg, #edf3fc 0%, #f8fbff 100%);
  border: 1px solid #dde8f7;
}

.feature-section,
.analysis-section,
.landing-cta {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 30px 20px;
}

.feature-section header h2,
.analysis-section h2,
.landing-cta h2 {
  margin: 0;
  font-size: 32px;
  color: #163d76;
}

.feature-section header p,
.landing-cta p {
  margin: 10px 0 0;
  color: #576f95;
}

.feature-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.feature-grid article {
  border: 1px solid #d8e4f2;
  background: #ffffff;
  border-radius: 14px;
  padding: 16px;
}

.feature-grid h3 {
  margin: 0;
  color: #234677;
  font-size: 20px;
}

.feature-grid p {
  margin: 8px 0 0;
  color: #607899;
  line-height: 1.6;
}

.analysis-section ul {
  margin: 14px 0 0;
  padding-left: 18px;
  color: #456187;
  line-height: 1.7;
}

.landing-cta {
  border: 1px solid #d8e3f2;
  background: #ffffff;
  border-radius: 18px;
}

.landing-footer {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 18px 20px 26px;
  display: flex;
  justify-content: space-between;
  color: #7188a6;
  font-size: 13px;
}

@media (max-width: 980px) {
  .landing-nav {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .landing-links {
    justify-self: start;
    flex-wrap: wrap;
  }

  .hero-section {
    grid-template-columns: 1fr;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .hero-stats {
    grid-template-columns: 1fr;
  }

  .landing-footer {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
