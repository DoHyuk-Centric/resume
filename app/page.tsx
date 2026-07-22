const features = [
  {
    number: "01",
    title: "한 번만 기록하세요",
    description: "프로젝트, 경력, 기술과 문제 해결 경험을 콘텐츠 보관함에 쌓습니다.",
  },
  {
    number: "02",
    title: "지원처에 맞게 고르세요",
    description: "기업과 직무에 필요한 콘텐츠만 선택하고 원하는 순서로 배치합니다.",
  },
  {
    number: "03",
    title: "웹과 PDF로 완성하세요",
    description: "검증된 템플릿을 적용하고 웹으로 공유하거나 PDF로 저장합니다.",
  },
];

export default function Home() {
  return (
    <main>
      <nav className="nav" aria-label="주요 메뉴">
        <a className="brand" href="#top">
          Resume Studio
        </a>
        <span className="status">MVP 준비 중</span>
      </nav>

      <section className="hero" id="top">
        <p className="eyebrow">CONTENT FIRST · TEMPLATE SECOND</p>
        <h1>
          경험은 한곳에,
          <br />지원서는 필요한 만큼.
        </h1>
        <p className="heroCopy">
          이력서와 포트폴리오를 매번 처음부터 만들지 마세요. 기록한 콘텐츠를
          지원처에 맞게 조립하고 원하는 템플릿으로 완성합니다.
        </p>
        <a className="primaryButton" href="#workflow">
          제품 구조 살펴보기
          <span aria-hidden="true">↘</span>
        </a>
      </section>

      <section className="workflow" id="workflow" aria-labelledby="workflow-title">
        <div className="sectionHeading">
          <p>WORKFLOW</p>
          <h2 id="workflow-title">기록에서 제출까지</h2>
        </div>
        <div className="featureGrid">
          {features.map((feature) => (
            <article className="feature" key={feature.number}>
              <span>{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
