import './styles.css';

const milestones = ['放置挖矿', '16x16 画布', '唯一资产鉴定', '平台内交易'];

function App() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Steam-ready pixel asset prototype</p>
        <h1>RGB 马赛克资产游戏</h1>
        <p className="lead">
          挖掘真实 RGB 颜色，把它们作为可消耗颜料填入像素画布，鉴定成平台内唯一资产，并为未来 Steam 库存与市场接入预留结构。
        </p>
      </section>

      <section className="loop" aria-label="MVP 核心循环">
        {milestones.map((item, index) => (
          <article className="loop-card" key={item}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h2>{item}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
