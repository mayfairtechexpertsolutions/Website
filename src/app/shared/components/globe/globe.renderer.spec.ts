import { GLOBE_EDGES, GLOBE_NODES, HUB_INDEX } from './globe.data';
import { GlobeLayers, GlobeRenderer, NODE_INDEX_ATTRIBUTE, NO_NODE_FOCUSED } from './globe.renderer';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function createLayers(): GlobeLayers {
  const group = () => document.createElementNS(SVG_NAMESPACE, 'g');
  return { latitudes: group(), meridians: group(), edges: group(), nodes: group(), pulse: group(), label: group() };
}

describe('GlobeRenderer', () => {
  let layers: GlobeLayers;
  let renderer: GlobeRenderer;

  beforeEach(() => {
    layers = createLayers();
    renderer = new GlobeRenderer(layers, (key) => `label:${key}`);
    renderer.build();
    Object.assign(SVGElement.prototype, { getBBox: () => ({ x: 0, y: 0, width: 80, height: 16 }) });
  });

  const nodeGroup = (index: number) => layers.nodes.querySelector(`[${NODE_INDEX_ATTRIBUTE}="${index}"]`) as SVGGElement;
  const edgeOpacity = (index: number) => Number(layers.edges.children[index].getAttribute('opacity'));

  it('builds one element per node, edge and ring', () => {
    expect(layers.nodes.children.length).toBe(GLOBE_NODES.length);
    expect(layers.edges.children.length).toBe(GLOBE_EDGES.length);
    expect(layers.pulse.children.length).toBe(2);
  });

  it('shows no label when nothing is focused', () => {
    renderer.render({ angle: 0, focusIndex: NO_NODE_FOCUSED });

    expect(layers.label.getAttribute('opacity')).toBe('0');
  });

  it('shows the translated label of the focused node', () => {
    renderer.render({ angle: 0, focusIndex: HUB_INDEX });

    expect(layers.label.textContent).toBe(`label:${GLOBE_NODES[HUB_INDEX].labelKey}`);
    expect(Number(layers.label.getAttribute('opacity'))).toBeGreaterThan(0);
  });

  it('hides the label while the focused node is on the far side', () => {
    renderer.render({ angle: Math.PI, focusIndex: HUB_INDEX });

    expect(Number(layers.label.getAttribute('opacity'))).toBe(0);
  });

  it('lights the edges of the focused node and enlarges it', () => {
    renderer.render({ angle: 0, focusIndex: NO_NODE_FOCUSED });
    const idleEdgeOpacity = edgeOpacity(GLOBE_EDGES.findIndex(([from]) => from === HUB_INDEX));
    const idleTransform = nodeGroup(HUB_INDEX).getAttribute('transform');

    renderer.render({ angle: 0, focusIndex: HUB_INDEX });

    expect(edgeOpacity(GLOBE_EDGES.findIndex(([from]) => from === HUB_INDEX))).toBeGreaterThan(idleEdgeOpacity);
    expect(nodeGroup(HUB_INDEX).getAttribute('transform')).not.toBe(idleTransform);
  });

  it('dims nodes that are not connected to the focused node', () => {
    renderer.render({ angle: 0, focusIndex: HUB_INDEX });
    const connected = new Set(GLOBE_EDGES.flatMap(([from, to]) => (from === HUB_INDEX ? [to] : to === HUB_INDEX ? [from] : [])));
    const unconnected = GLOBE_NODES.findIndex((_, index) => index !== HUB_INDEX && !connected.has(index));

    expect(Number(nodeGroup(unconnected).getAttribute('opacity'))).toBeLessThan(Number(nodeGroup(HUB_INDEX).getAttribute('opacity')));
  });

  it('disables hit testing for nodes on the far side', () => {
    renderer.render({ angle: Math.PI, focusIndex: NO_NODE_FOCUSED });

    expect(nodeGroup(HUB_INDEX).firstElementChild?.getAttribute('pointer-events')).toBe('none');
  });
});
