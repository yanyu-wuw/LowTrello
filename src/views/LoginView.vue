<template>
  <div class="login-page">
    <div class="deco deco-left" aria-hidden="true">
      <div class="mini-board"></div>
      <div class="mini-card"></div>
      <div class="mini-card short"></div>
    </div>

    <section class="login-card">
      <header class="login-head">
        <img class="brand-logo-image" src="/favicon.svg" alt="LowTrello logo" />
        <h1>LowTrello</h1>
      </header>

      <p class="login-subtitle">{{ t('auth.loginToContinue') }}</p>

      <p v-if="isVerifyMode" class="verify-hint">{{ t('auth.enterCodeHint') }}</p>

      <label class="field-label" for="email-field">{{ t('auth.email') }}</label>
      <el-input
        id="email-field"
        class="login-input"
        v-model="email"
        size="large"
        :disabled="submitting"
        :placeholder="t('auth.emailPlaceholder')"
        @keyup.enter="submitEmail"
      />

      <template v-if="showPasswordField">
        <label class="field-label" for="password-field">{{ t('auth.password') }}</label>
        <el-input
          id="password-field"
          class="login-input"
          v-model="password"
          type="password"
          show-password
          size="large"
          :disabled="submitting"
          :placeholder="t('auth.passwordPlaceholder')"
          @keyup.enter="submitEmail"
        />
      </template>

      <template v-if="isVerifyMode">
        <label class="field-label" for="code-field">{{ t('auth.verificationCode') }}</label>
        <el-input
          id="code-field"
          class="login-input"
          v-model="verificationCode"
          size="large"
          :disabled="submitting"
          :placeholder="t('auth.codePlaceholder')"
          @keyup.enter="submitEmail"
        />
      </template>

      <div class="remember-row">
        <el-checkbox v-model="rememberMe">{{ t('auth.remember') }}</el-checkbox>
      </div>

      <el-button
        class="full-btn"
        type="primary"
        size="large"
        :loading="submitting"
        :disabled="submitting"
        @click="submitEmail"
      >
        {{ isVerifyMode ? t('auth.verifyAndLogin') : t('auth.continue') }}
      </el-button>

      <el-button
        v-if="isVerifyMode"
        class="full-btn"
        size="large"
        :disabled="submitting"
        @click="resendCode"
      >
        {{ t('auth.resendCode') }}
      </el-button>

      <p v-if="!isVerifyMode" class="split-title">{{ t('auth.continueWith') }}</p>

      <div v-if="!isVerifyMode" class="provider-list">
        <button
          v-for="provider in providerOptions"
          :key="provider.id"
          class="provider-btn"
          @click="loginWithProvider(provider.label)"
        >
          <ProviderBrandIcon :provider-id="provider.id" class="provider-icon" />
          <span class="provider-label">{{ provider.label }}</span>
        </button>
      </div>

      <footer class="login-foot">
        <button v-if="isVerifyMode" @click="exitVerifyMode">{{ t('common.back') }}</button>
        <template v-else>
          <button @click="openForgotPassword">{{ t('auth.forgot') }}</button>
          <span>·</span>
          <button @click="createAccount">{{ t('auth.createAccount') }}</button>
        </template>
      </footer>

      <el-dialog v-model="forgotVisible" :title="t('auth.forgotDialogTitle')" width="420px" :close-on-click-modal="false">
        <p class="forgot-desc">{{ t('auth.forgotDialogDesc') }}</p>

        <label class="field-label" for="reset-email">{{ t('auth.email') }}</label>
        <el-input
          id="reset-email"
          class="login-input"
          v-model="resetEmail"
          size="large"
          :disabled="resetSubmitting"
          :placeholder="t('auth.emailPlaceholder')"
        />

        <template v-if="resetStep === 'reset'">
          <label class="field-label" for="reset-code">{{ t('auth.verificationCode') }}</label>
          <el-input
            id="reset-code"
            class="login-input"
            v-model="resetCode"
            size="large"
            :disabled="resetSubmitting"
            :placeholder="t('auth.codePlaceholder')"
            @keyup.enter="submitResetPassword"
          />

          <label class="field-label" for="reset-newpwd">{{ t('auth.newPassword') }}</label>
          <el-input
            id="reset-newpwd"
            class="login-input"
            v-model="resetNewPassword"
            type="password"
            show-password
            size="large"
            :disabled="resetSubmitting"
            :placeholder="t('auth.newPasswordPlaceholder')"
            @keyup.enter="submitResetPassword"
          />
        </template>

        <template #footer>
          <div class="forgot-actions">
            <el-button :disabled="resetSubmitting" @click="closeForgotPassword">{{ t('common.cancel') }}</el-button>

            <el-button
              v-if="resetStep === 'request'"
              type="primary"
              :loading="resetSubmitting"
              :disabled="resetSubmitting"
              @click="sendResetCode"
            >
              {{ t('auth.sendResetCode') }}
            </el-button>

            <template v-else>
              <el-button :disabled="resetSubmitting" @click="sendResetCode">{{ t('auth.resendCode') }}</el-button>
              <el-button
                type="primary"
                :loading="resetSubmitting"
                :disabled="resetSubmitting"
                @click="submitResetPassword"
              >
                {{ t('auth.resetPassword') }}
              </el-button>
            </template>
          </div>
        </template>
      </el-dialog>

      <div class="lang-row">
        <span>{{ t('common.language') }}:</span>
        <button :class="['lang-btn', { active: locale === 'zh' }]" @click="setLang('zh')">{{ t('common.chinese') }}</button>
        <button :class="['lang-btn', { active: locale === 'en' }]" @click="setLang('en')">{{ t('common.english') }}</button>
      </div>
    </section>

    <div class="deco deco-right" aria-hidden="true">
      <div class="figure"></div>
      <div class="mini-board"></div>
      <div class="mini-card"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ProviderBrandIcon from '../components/common/ProviderBrandIcon.vue'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const verificationCode = ref('')
const rememberMe = ref(true)
const submitting = ref(false)
const mode = ref('login')

const forgotVisible = ref(false)
const resetStep = ref('request')
const resetEmail = ref('')
const resetCode = ref('')
const resetNewPassword = ref('')
const resetSubmitting = ref(false)

const locale = computed(() => userStore.locale)
const t = userStore.t
const isVerifyMode = computed(() => mode.value === 'verify')
const showPasswordField = computed(() => !isVerifyMode.value && email.value.trim().length > 0)
const providerOptions = computed(() => {
  if (locale.value === 'zh') {
    return [
      { id: 'phone', label: '手机号登录' },
      { id: 'wechat', label: '第三方账号登录 A' },
      { id: 'qrcode', label: '扫码登录' },
      { id: 'qq', label: '第三方账号登录 B' }
    ]
  }

  return [
    { id: 'passkey', label: t('auth.passkey') },
    { id: 'google', label: 'Third-party account A' },
    { id: 'microsoft', label: 'Third-party account B' },
    { id: 'apple', label: 'Third-party account C' },
    { id: 'slack', label: 'Third-party workspace D' }
  ]
})

onMounted(() => {
  syncTitle()

  if (userStore.isAuthenticated) {
    router.replace(getSafeRedirect())
  }
})

watch(
  () => userStore.isAuthenticated,
  (next) => {
    if (next) {
      router.replace(getSafeRedirect())
    }
  }
)

watch(locale, () => {
  syncTitle()
})

watch(email, (value) => {
  if (!value.trim()) {
    password.value = ''
    verificationCode.value = ''
  }
})

function submitEmail() {
  if (submitting.value) return

  const valid = /.+@.+\..+/.test(email.value.trim())
  if (!valid) {
    ElMessage.warning(t('auth.emailRequired'))
    return
  }

  submitting.value = true

  if (isVerifyMode.value) {
    const code = verificationCode.value.trim()
    if (!code) {
      ElMessage.warning(t('auth.codeRequired'))
      submitting.value = false
      return
    }

    userStore
      .verifyEmailCode(email.value, code, { remember: rememberMe.value })
      .then((result) => {
        if (!result?.ok) {
          if (result?.reason === 'INVALID_CODE') {
            ElMessage.error(t('auth.invalidCode'))
            return
          }

          if (result?.reason === 'CODE_NOT_FOUND') {
            ElMessage.error(t('auth.codeExpired'))
            return
          }

          ElMessage.error(t('auth.networkError'))
          return
        }

        ElMessage.success(t('auth.loginSuccess'))
        router.push(getSafeRedirect())
      })
      .catch(() => {
        ElMessage.error(t('auth.networkError'))
      })
      .finally(() => {
        submitting.value = false
      })

    return
  }

  if (showPasswordField.value && !password.value.trim()) {
    ElMessage.warning(t('auth.passwordRequired'))
    submitting.value = false
    return
  }

  if (showPasswordField.value && password.value.trim().length < 6) {
    ElMessage.warning(t('auth.passwordMinLength'))
    submitting.value = false
    return
  }

  userStore
    .loginWithPassword(email.value, password.value, { remember: rememberMe.value })
    .then((result) => {
      if (!result?.ok) {
        if (result?.reason === 'EMAIL_NOT_VERIFIED') {
          mode.value = 'verify'
          verificationCode.value = ''
          ElMessage.warning(t('auth.emailNotVerified'))
          userStore.resendVerificationCode(email.value).catch(() => {})
          return
        }

        ElMessage.error(t('auth.invalidCredentials'))
        return
      }

      ElMessage.success(t('auth.loginSuccess'))
      router.push(getSafeRedirect())
    })
    .catch(() => {
      ElMessage.error(t('auth.networkError'))
    })
    .finally(() => {
      submitting.value = false
    })
}

function loginWithProvider(provider) {
  noopAction()
}

function createAccount() {
  if (submitting.value) return

  const valid = /.+@.+\..+/.test(email.value.trim())
  if (!valid) {
    ElMessage.warning(t('auth.emailRequired'))
    return
  }

  if (!password.value.trim()) {
    ElMessage.warning(t('auth.passwordRequired'))
    return
  }

  if (password.value.trim().length < 6) {
    ElMessage.warning(t('auth.passwordMinLength'))
    return
  }

  const nameFromEmail = String(email.value || '').trim().split('@')[0] || 'User'

  submitting.value = true
  userStore
    .registerWithPassword(
      {
        email: email.value,
        password: password.value,
        name: nameFromEmail
      },
      { remember: rememberMe.value }
    )
    .then((result) => {
      if (!result?.ok) {
        if (result?.reason === 'EMAIL_EXISTS') {
          return userStore.loginWithPassword(email.value, password.value, { remember: rememberMe.value }).then((loginResult) => {
            if (!loginResult?.ok) {
              if (loginResult?.reason === 'EMAIL_NOT_VERIFIED') {
                mode.value = 'verify'
                verificationCode.value = ''
                ElMessage.warning(t('auth.emailNotVerified'))
                userStore.resendVerificationCode(email.value).catch(() => {})
                return
              }

              ElMessage.error(t('auth.emailExists'))
              return
            }

            ElMessage.success(t('auth.loginSuccess'))
            router.push(getSafeRedirect())
          })
        }

        ElMessage.error(t('auth.networkError'))
        return
      }

      if (result?.requiresVerification) {
        mode.value = 'verify'
        verificationCode.value = ''
        ElMessage.success(t('auth.codeSent'))
        return
      }

      ElMessage.success(t('auth.loginSuccess'))
      router.push(getSafeRedirect())
    })
    .catch(() => {
      ElMessage.error(t('auth.networkError'))
    })
    .finally(() => {
      submitting.value = false
    })
}

function exitVerifyMode() {
  mode.value = 'login'
  verificationCode.value = ''
}

function resendCode() {
  if (submitting.value) return

  submitting.value = true
  userStore
    .resendVerificationCode(email.value)
    .then((result) => {
      if (!result?.ok) {
        if (result?.reason === 'TOO_MANY_REQUESTS') {
          ElMessage.warning(t('auth.tooManyRequests'))
          return
        }
        ElMessage.error(t('auth.networkError'))
        return
      }

      ElMessage.success(t('auth.codeSent'))
    })
    .catch(() => {
      ElMessage.error(t('auth.networkError'))
    })
    .finally(() => {
      submitting.value = false
    })
}

function setLang(nextLocale) {
  userStore.setLocale(nextLocale)
}

function noopAction() {
  ElMessage.info(t('auth.demoOnly'))
}

function openForgotPassword() {
  if (submitting.value) return
  forgotVisible.value = true
  resetStep.value = 'request'
  resetEmail.value = email.value
  resetCode.value = ''
  resetNewPassword.value = ''
}

function closeForgotPassword() {
  if (resetSubmitting.value) return
  forgotVisible.value = false
}

function sendResetCode() {
  if (resetSubmitting.value) return

  const valid = /.+@.+\..+/.test(resetEmail.value.trim())
  if (!valid) {
    ElMessage.warning(t('auth.emailRequired'))
    return
  }

  resetSubmitting.value = true
  userStore
    .requestPasswordReset(resetEmail.value)
    .then((result) => {
      if (!result?.ok) {
        if (result?.reason === 'TOO_MANY_REQUESTS') {
          ElMessage.warning(t('auth.tooManyRequests'))
          return
        }

        ElMessage.error(t('auth.networkError'))
        return
      }

      resetStep.value = 'reset'
      ElMessage.success(t('auth.resetCodeSent'))
    })
    .catch(() => {
      ElMessage.error(t('auth.networkError'))
    })
    .finally(() => {
      resetSubmitting.value = false
    })
}

function submitResetPassword() {
  if (resetSubmitting.value) return

  const valid = /.+@.+\..+/.test(resetEmail.value.trim())
  if (!valid) {
    ElMessage.warning(t('auth.emailRequired'))
    return
  }

  if (!resetCode.value.trim()) {
    ElMessage.warning(t('auth.codeRequired'))
    return
  }

  if (!resetNewPassword.value.trim()) {
    ElMessage.warning(t('auth.passwordRequired'))
    return
  }

  if (resetNewPassword.value.trim().length < 6) {
    ElMessage.warning(t('auth.passwordMinLength'))
    return
  }

  resetSubmitting.value = true
  userStore
    .resetPassword({
      email: resetEmail.value,
      code: resetCode.value,
      newPassword: resetNewPassword.value
    })
    .then((result) => {
      if (!result?.ok) {
        if (result?.reason === 'INVALID_CODE') {
          ElMessage.error(t('auth.invalidCode'))
          return
        }

        if (result?.reason === 'CODE_NOT_FOUND') {
          ElMessage.error(t('auth.codeExpired'))
          return
        }

        ElMessage.error(t('auth.resetFailed'))
        return
      }

      // Auto login after reset
      return userStore.loginWithPassword(resetEmail.value, resetNewPassword.value, { remember: rememberMe.value }).then((loginResult) => {
        if (!loginResult?.ok) {
          ElMessage.success(t('auth.resetSuccess'))
          closeForgotPassword()
          return
        }

        ElMessage.success(t('auth.resetAndLoginSuccess'))
        closeForgotPassword()
        router.push(getSafeRedirect())
      })
    })
    .catch(() => {
      ElMessage.error(t('auth.networkError'))
    })
    .finally(() => {
      resetSubmitting.value = false
    })
}

function syncTitle() {
  document.title = t('auth.loginTabTitle')
}

function getSafeRedirect() {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('/login')) {
    return redirect
  }

  return { name: 'workspace' }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f4f5f7;
  display: grid;
  grid-template-columns: 1fr 400px 1fr;
  align-items: center;
  gap: 28px;
  padding: 24px;
  position: relative;
  font-family: 'Charlie Text', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.login-card {
  width: 400px;
  max-width: calc(100vw - 32px);
  background: #ffffff;
  border: 1px solid #dfe1e6;
  box-shadow: 0 8px 24px rgba(9, 30, 66, 0.15);
  border-radius: 4px;
  padding: 34px 40px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login-head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.brand-logo-image {
  display: inline-block;
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.login-head h1 {
  margin: 0;
  color: #172b4d;
  font-size: 42px;
  font-weight: 500;
  letter-spacing: -0.3px;
  line-height: 1;
}

.login-subtitle {
  margin: 4px 0 0;
  text-align: center;
  color: #172b4d;
  font-size: 30px;
  font-weight: 700;
}

.verify-hint {
  width: 320px;
  margin: -2px auto 2px;
  font-size: 13px;
  color: #44546f;
  text-align: center;
}

.field-label {
  width: 320px;
  margin: 0 auto;
  font-size: 12px;
  color: #44546f;
  font-weight: 600;
}

.remember-row {
  width: 320px;
  margin: -4px auto 0;
}

.full-btn {
  width: 320px;
  height: 40px;
  margin: 0 auto;
}

.split-title {
  margin: 8px 0 0;
  text-align: center;
  color: #44546f;
  font-weight: 600;
  font-size: 14px;
}

.provider-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.provider-btn {
  width: 320px;
  height: 40px;
  border: 1px solid #d0d4dd;
  border-radius: 3px;
  background: #ffffff;
  color: #172b4d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 12px;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease;
}

.provider-icon {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
}

.provider-label {
  font-size: 16px;
  line-height: 1.2;
  font-weight: 600;
}

.provider-btn:hover {
  background: #f7f8f9;
  border-color: #b6c2cf;
}

.login-foot {
  margin-top: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.login-foot button {
  border: 0;
  background: transparent;
  color: #0c66e4;
  font-size: 13px;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.forgot-desc {
  margin: 0 0 12px;
  color: #5e6c84;
  font-size: 13px;
  line-height: 1.5;
}

.forgot-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.lang-row {
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #5e6c84;
  font-size: 12px;
}

.lang-btn {
  border: 1px solid #d0d4dd;
  background: #ffffff;
  color: #42526e;
  border-radius: 999px;
  padding: 3px 10px;
  cursor: pointer;
}

.lang-btn.active {
  background: #0c66e4;
  color: #ffffff;
  border-color: #0c66e4;
}

:deep(.login-input) {
  width: 320px;
  margin: 0 auto;
}

:deep(.login-input .el-input__wrapper) {
  height: 40px;
  min-height: 40px;
  border-radius: 3px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px #c1c7d0;
}

:deep(.login-input .el-input__wrapper.is-focus) {
  box-shadow: inset 0 0 0 2px #4c9aff;
}

:deep(.login-input .el-input__inner) {
  color: #172b4d;
  font-size: 14px;
}

:deep(.login-input .el-input__suffix-inner .el-icon) {
  color: #5e6c84;
}

:deep(.remember-row .el-checkbox__label) {
  color: #172b4d;
  font-size: 13px;
}

:deep(.remember-row .el-checkbox__inner) {
  border-color: #8993a4;
  border-radius: 3px;
}

:deep(.full-btn.el-button) {
  border-radius: 3px;
  border-color: #0c66e4;
  background: #0c66e4;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
}

:deep(.full-btn.el-button:hover) {
  border-color: #0055cc;
  background: #0055cc;
}

.deco {
  min-height: 520px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;
  opacity: 0.55;
}

.deco-left {
  align-items: flex-end;
}

.deco-right {
  align-items: flex-start;
}

.mini-board {
  width: 250px;
  height: 140px;
  border: 1px solid #c6d2e2;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #edf2fb 100%);
}

.mini-card {
  width: 170px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #d8e1ef;
  background: #ffffff;
}

.mini-card.short {
  width: 100px;
}

.figure {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ff8585 0%, #ff5656 70%);
}

@media (max-width: 1100px) {
  .login-page {
    grid-template-columns: 1fr;
    place-items: center;
  }

  .login-card {
    width: min(400px, calc(100vw - 24px));
    padding: 28px 20px 20px;
  }

  .field-label,
  .remember-row,
  .full-btn,
  .provider-btn,
  :deep(.login-input) {
    width: min(320px, calc(100vw - 72px));
  }

  .login-head h1 {
    font-size: 34px;
  }

  .login-subtitle {
    font-size: 24px;
  }

  .provider-label {
    font-size: 15px;
  }

  .deco {
    display: none;
  }
}
</style>
