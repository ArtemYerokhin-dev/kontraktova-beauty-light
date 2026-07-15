export default function Button({ variant = 'primary', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium duration-150 disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98]',
    secondary: 'bg-black/5 text-ink hover:bg-black/10 border border-black/10',
    ghost: 'text-black/60 hover:text-ink',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
