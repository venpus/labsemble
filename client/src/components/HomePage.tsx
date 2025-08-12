import React from 'react';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      {/* 히어로 섹션 */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            효과적인 임베디드 <br /> 생산 개발 서비스
          </h1>
          <p className="hero-subtitle">
            최신 기술과 전문성을 바탕으로 고품질의 임베디드 솔루션을 제공합니다
          </p>
          <div className="hero-buttons">
            <button className="cta-button primary">서비스 시작하기</button>
            <button className="cta-button secondary">자세히 보기</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="tech-icons">
            <span className="tech-icon">🔧</span>
            <span className="tech-icon">⚡</span>
            <span className="tech-icon">🚀</span>
            <span className="tech-icon">💡</span>
          </div>
        </div>
      </section>

      {/* 서비스 섹션 */}
      <section className="services-section">
        <div className="container">
          <h2 className="section-title">우리의 서비스</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">🔧</div>
              <h3>임베디드 시스템 개발</h3>
              <p>IoT, 산업용 제어 시스템, 스마트 디바이스 등 다양한 임베디드 솔루션을 개발합니다.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">⚡</div>
              <h3>하드웨어 설계</h3>
              <p>PCB 설계, 회로 설계, 프로토타이핑을 통한 최적화된 하드웨어 솔루션을 제공합니다.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🚀</div>
              <h3>펌웨어 개발</h3>
              <p>실시간 운영체제, 드라이버 개발, 최적화된 펌웨어로 안정적인 시스템을 구축합니다.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">💡</div>
              <h3>시스템 통합</h3>
              <p>하드웨어와 소프트웨어의 완벽한 통합으로 종합적인 임베디드 솔루션을 제공합니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 기술 스택 섹션 */}
      <section className="tech-section">
        <div className="container">
          <h2 className="section-title">기술 스택</h2>
          <div className="tech-grid">
            <div className="tech-category">
              <h3>하드웨어</h3>
              <ul>
                <li>ARM Cortex-M 시리즈</li>
                <li>STM32, ESP32</li>
                <li>PCB 설계 (KiCad, Eagle)</li>
                <li>FPGA/CPLD</li>
              </ul>
            </div>
            <div className="tech-category">
              <h3>소프트웨어</h3>
              <ul>
                <li>C/C++</li>
                <li>Python</li>
                <li>FreeRTOS</li>
                <li>Linux 임베디드</li>
              </ul>
            </div>
            <div className="tech-category">
              <h3>통신</h3>
              <ul>
                <li>WiFi, Bluetooth</li>
                <li>CAN, SPI, I2C</li>
                <li>MQTT, HTTP</li>
                <li>LoRa, Zigbee</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 프로젝트 섹션 */}
      <section className="projects-section">
        <div className="container">
          <h2 className="section-title">주요 프로젝트</h2>
          <div className="projects-grid">
            <div className="project-card">
              <div className="project-image">🏭</div>
              <h3>스마트 팩토리 모니터링</h3>
              <p>실시간 센서 데이터 수집 및 분석을 통한 생산성 향상 시스템</p>
            </div>
            <div className="project-card">
              <div className="project-image">🏠</div>
              <h3>스마트 홈 IoT</h3>
              <p>에너지 효율성과 편의성을 동시에 만족하는 스마트 홈 솔루션</p>
            </div>
            <div className="project-card">
              <div className="project-image">🚗</div>
              <h3>자동차 전자 시스템</h3>
              <p>안전성과 성능을 고려한 차량용 임베디드 제어 시스템</p>
            </div>
          </div>
        </div>
      </section>

      {/* 문의 섹션 */}
      <section className="contact-section">
        <div className="container">
          <h2 className="section-title">프로젝트 문의</h2>
          <p className="contact-text">
            임베디드 개발 프로젝트에 대해 궁금한 점이 있으시면 언제든 연락주세요.
          </p>
          <button className="contact-button">문의하기</button>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 