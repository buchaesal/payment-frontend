<template>
  <div class="layout">
    <nav class="navigation">
      <div class="nav-container">
        <div class="nav-brand">
          <NuxtLink to="/" class="brand-link">토스페이먼츠 샘플</NuxtLink>
        </div>
        <div class="nav-menu">
          <NuxtLink to="/paymentSheet" class="nav-link" active-class="active">
            결제하기
          </NuxtLink>
          <NuxtLink to="/payment/history" class="nav-link" active-class="active">
            결제내역
          </NuxtLink>
        </div>
      </div>
    </nav>
    
    <main class="main-content">
      <slot></slot>
    </main>
  </div>
</template>

<script setup>
// 내비게이션이 포함된 기본 레이아웃
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navigation {
  background-color: #fff;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
}

.nav-brand {
  display: flex;
  align-items: center;
}

.brand-link {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  text-decoration: none;
  transition: color 0.3s ease;
}

.brand-link:hover {
  color: #3498db;
}

.nav-menu {
  display: flex;
  gap: 30px;
  align-items: center;
}

.nav-link {
  padding: 8px 16px;
  text-decoration: none;
  color: #666;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: #3498db;
  background-color: #f8f9fa;
}

.nav-link.active {
  color: #3498db;
  background-color: #e3f2fd;
}

.main-content {
  flex: 1;
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 15px;
    height: 50px;
  }
  
  .brand-link {
    font-size: 18px;
  }
  
  .nav-menu {
    gap: 15px;
  }
  
  .nav-link {
    padding: 6px 12px;
    font-size: 14px;
  }
}
</style>