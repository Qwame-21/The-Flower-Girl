import '../liquid.css';

// Direction follows the action; the pulse always travels toward its destination.
export default function FlowArrow({ size = 18, direction = 'right' }) {
  return <span className={`admin-flow-arrow is-${direction}`} style={{ '--arrow-size': `${size}px` }} aria-hidden="true">
    {[0, 1, 2].map(index => <i key={index} style={{ '--step': index }} />)}
  </span>;
}
