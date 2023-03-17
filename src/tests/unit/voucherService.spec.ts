import { jest } from "@jest/globals";
import voucherRepository from "repositories/voucherRepository";
import voucherService from "services/voucherService";

const voucher = {
  code: "test1",
  discount: 10,
};

describe("post /vouchers", () => {
  it("should not create a voucher if it already exists", () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return {
          id: 1,
          code: voucher.code,
          discount: voucher.discount,
          used: false,
        };
      });

    const promise = voucherService.createVoucher(
      voucher.code,
      voucher.discount
    );

    expect(promise).rejects.toEqual({
      message: "Voucher already exist.",
      type: "conflict",
    });
  });

  it("should not create a voucher if discount is 1 or lower", () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return undefined;
      });

    jest
      .spyOn(voucherRepository, "createVoucher")
      .mockImplementationOnce((): any => {});

    const promise = voucherService.createVoucher(voucher.code, 1);

    expect(promise).rejects.toEqual({
      message: "Invalid discount value.",
      type: "bad_request",
    });
  });

  it("should not create a voucher if discount is 100 or higher", () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return undefined;
      });

    jest
      .spyOn(voucherRepository, "createVoucher")
      .mockImplementationOnce((): any => {});

    const promise = voucherService.createVoucher(voucher.code, 100);

    expect(promise).rejects.toEqual({
      message: "Invalid discount value.",
      type: "bad_request",
    });
  });

  it("should create a voucher", () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return undefined;
      });

    jest
      .spyOn(voucherRepository, "createVoucher")
      .mockImplementationOnce((): any => {});

    const promise = voucherService.createVoucher(
      voucher.code,
      voucher.discount
    );

    expect(promise).resolves;
  });
});

describe("post /vouchers/apply", () => {
  it("should not apply discount for values below 100", async () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return {
          id: 1,
          code: voucher.code,
          discount: voucher.discount,
          used: false,
        };
      });

    jest
      .spyOn(voucherRepository, "useVoucher")
      .mockImplementationOnce((): any => {});

    const amount = 50;
    const order = await voucherService.applyVoucher(voucher.code, amount);
    expect(order.amount).toBe(amount);
    expect(order.discount).toBe(10);
    expect(order.finalAmount).toBe(amount);
    expect(order.applied).toBe(false);
  });

  it("should not apply discount for invalid voucher", () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return undefined;
      });

    const amount = 100;
    const promise = voucherService.applyVoucher(voucher.code, amount);

    expect(promise).rejects.toEqual({
      message: "Voucher does not exist.",
      type: "conflict",
    });
  });

  it("should not apply discount if voucher is used", async () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return {
          id: 1,
          code: voucher.code,
          discount: voucher.discount,
          used: true,
        };
      });

    const amount = 100;
    const order = await voucherService.applyVoucher(voucher.code, amount);
    expect(order.amount).toBe(amount);
    expect(order.discount).toBe(10);
    expect(order.finalAmount).toBe(amount);
    expect(order.applied).toBe(false);
  });

  it("should apply discount and set voucher to used", async () => {
    jest
      .spyOn(voucherRepository, "getVoucherByCode")
      .mockImplementationOnce((): any => {
        return {
          id: 1,
          code: voucher.code,
          discount: voucher.discount,
          used: false,
        };
      });

    jest
      .spyOn(voucherRepository, "useVoucher")
      .mockImplementationOnce((): any => {});

    const amount = 100;
    const order = await voucherService.applyVoucher(voucher.code, amount);

    expect(order.amount).toBe(amount);
    expect(order.discount).toBe(10);
    expect(order.finalAmount).toBe(amount - amount * (voucher.discount / 100));
    expect(order.applied).toBe(true);
  });
});
