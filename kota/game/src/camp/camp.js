// Camp screens (DESIGN-m1.md sections 11, 13 and 14): the hub, the upgrades bought with goods, and the elder's stories.

export function showCamp(app, data, begin) {
  const c = app.camp;
  const unlocked = data.stories.filter((s) => c.met.includes(s.when));
  const options = [
    { label: 'Begin a run', detail: 'Play as Ash Wolf', onClick: begin },
    { label: 'Camp', detail: `Spend goods (${c.goods})`, onClick: () => showUpgrades(app, data, begin) },
  ];
  if (unlocked.length) options.push({ label: 'Elder', detail: 'Hear a story', onClick: () => showStories(app, data, begin) });
  const totals = `Runs ${c.runs}   Wins ${c.wins}   Best wave ${c.bestWave}   Goods ${c.goods}`;
  app.ui.show("Camp in Cansa'yapi",
    "Cansa'yapi: where they marked the trees red (the Minnesota River Valley).\n"
    + `Iya, the Camp-Eater, has swallowed a camp. Follow him through the homeland and bring the people out.\n${totals}`,
    options);
}

function showUpgrades(app, data, begin) {
  const c = app.camp;
  const options = data.upgrades.map((u) => {
    const built = c.built.includes(u.id);
    return {
      label: u.name,
      detail: `${u.text}\n${built ? 'Built' : `Costs ${u.cost} goods`}`,
      disabled: built || c.goods < u.cost,
      onClick: () => { c.goods -= u.cost; c.built.push(u.id); app.saveCamp(); app.audio.pickup(); showUpgrades(app, data, begin); },
    };
  });
  options.push({ label: 'Back', onClick: () => showCamp(app, data, begin) });
  app.ui.show('The camp', `Goods returned to the people: ${c.goods}. Each upgrade lasts for every run.`, options);
}

function showStories(app, data, begin) {
  const options = data.stories.filter((s) => app.camp.met.includes(s.when)).map((s) => ({
    label: s.title,
    onClick: () => app.ui.show(s.title, `${s.text}\n\n${s.credit}`, [{ label: 'Back', onClick: () => showStories(app, data, begin) }]),
  }));
  options.push({ label: 'Back', onClick: () => showCamp(app, data, begin) });
  app.ui.show('The elder', 'Stories the people tell about those you have met.', options);
}
