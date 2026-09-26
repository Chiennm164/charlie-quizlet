import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  const options = { title: 'Xoá?', message: 'Không hoàn tác được' };

  it('trả về lựa chọn của người dùng và đóng hộp thoại', async () => {
    const service = new ConfirmDialogService();
    const result = service.confirm(options);
    expect(service.isOpen()).toBe(true);
    expect(service.options()).toEqual(options);

    service.close(true);
    await expect(result).resolves.toBe(true);
    expect(service.isOpen()).toBe(false);
  });

  it('mở hộp thoại mới khi hộp cũ chưa trả lời -> hộp cũ coi như huỷ', async () => {
    const service = new ConfirmDialogService();
    const first = service.confirm(options);
    const second = service.confirm({ ...options, title: 'Khác' });

    await expect(first).resolves.toBe(false);
    service.close(true);
    await expect(second).resolves.toBe(true);
  });
});
