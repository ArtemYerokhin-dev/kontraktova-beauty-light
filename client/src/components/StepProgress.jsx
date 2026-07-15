const STEP_LABELS = ['Категорія', 'Послуга', 'Майстер', 'Дата й час', 'Контакти', 'Підтвердження'];

export default function StepProgress({ step }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-1.5">
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full duration-200 ${
              i < step ? 'bg-accent' : 'bg-black/10'
            }`}
          />
        ))}
      </div>
      <p className="mt-3 text-xs uppercase tracking-wider text-black/40">
        Крок {step} з {STEP_LABELS.length} · {STEP_LABELS[step - 1]}
      </p>
    </div>
  );
}
