"use client";

type Props = {
  onConfirm: () => void;
  onCancel: () => void;
};

export function MediaReplaceConfirmDialog({ onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="panel w-full max-w-md p-5 shadow-2xl">
        <p className="mb-5 text-lg font-bold">Вы действительно хотите изменить ранее загруженный файл на новый</p>
        <div className="flex flex-wrap justify-end gap-2">
          <button className="btn btn-secondary" type="button" onClick={onConfirm}>
            Загрузить новый файл
          </button>
          <button className="btn btn-primary" type="button" onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
