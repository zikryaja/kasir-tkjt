"use client";

import { useEffect, useMemo, useState } from "react";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function KasirPage() {
  const [products, setProducts] = useState([]);
  const [members, setMembers] = useState([]);
  const [promo, setPromo] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [cart, setCart] = useState([]);
  const [memberId, setMemberId] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentAmount, setPaymentAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [showMemberModal, setShowMemberModal] = useState(false);

  const [memberForm, setMemberForm] = useState({
    name: "",
    phone: "",
  });

  // =========================================================
  // LOAD DATA
  // =========================================================

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const [productsRes, membersRes, promoRes] = await Promise.all([
        fetch("/api/products?status=active"),
        fetch("/api/members"),
        fetch("/api/member-events?current=1"),
      ]);

      const productsJson = await productsRes.json();
      const membersJson = await membersRes.json();
      const promoJson = await promoRes.json();

      if (!productsRes.ok) {
        throw new Error(
          productsJson.message || "Gagal mengambil data produk."
        );
      }

      if (!membersRes.ok) {
        throw new Error(
          membersJson.message || "Gagal mengambil data member."
        );
      }

      setProducts(productsJson.data || []);
      setMembers(membersJson.data || []);

      // -------------------------------------------------------
      // PROMO
      // Bisa menerima:
      // data: {...}
      // atau
      // data: [{...}]
      // -------------------------------------------------------

      const promoData = promoJson.success ? promoJson.data : null;

      const currentPromo = Array.isArray(promoData)
        ? promoData[0] || null
        : promoData || null;

      if (currentPromo) {
        setPromo({
          ...currentPromo,
          discount_value: Number(
            currentPromo.discount_value ??
              currentPromo.discount ??
              currentPromo.discountValue ??
              0
          ),
          minimum_purchase: Number(
            currentPromo.minimum_purchase ??
              currentPromo.min_purchase ??
              currentPromo.minimumPurchase ??
              0
          ),
        });
      } else {
        setPromo(null);
      }
    } catch (error) {
      console.error("Kasir load error:", error);
      setMessage(error.message || "Gagal mengambil data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // CATEGORY
  // =========================================================

  const categories = useMemo(() => {
    const unique = new Map();

    products.forEach((product) => {
      if (product.category_id) {
        unique.set(
          product.category_id,
          product.category_name || "Tanpa kategori"
        );
      }
    });

    return Array.from(unique.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [products]);

  // =========================================================
  // FILTER PRODUCT
  // =========================================================

  const filteredProducts = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return products.filter((product) => {
      const matchesSearch =
        !keyword ||
        product.name?.toLowerCase().includes(keyword) ||
        product.sku?.toLowerCase().includes(keyword);

      const matchesCategory =
        category === "all" ||
        String(product.category_id) === String(category);

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  // =========================================================
  // CART
  // =========================================================

  function addToCart(product) {
    const stock = Number(product.stock || 0);

    if (stock <= 0) return;

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= stock) {
          return current;
        }

        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price || 0),
          stock,
          quantity: 1,
          photo: product.photo,
        },
      ];
    });
  }

  function increaseQuantity(id) {
    setCart((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        if (item.quantity >= item.stock) {
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      })
    );
  }

  function decreaseQuantity(id) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  // =========================================================
  // MEMBER
  // =========================================================

  const selectedMember = useMemo(() => {
    return members.find(
      (member) => String(member.id) === String(memberId)
    );
  }, [members, memberId]);

  // =========================================================
  // TOTAL
  // =========================================================

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => total + Number(item.price) * item.quantity,
      0
    );
  }, [cart]);

  // =========================================================
  // PROMO DISCOUNT
  // =========================================================

  const discount = useMemo(() => {
    if (!selectedMember || !promo) {
      return 0;
    }

    const minimumPurchase = Number(
      promo.minimum_purchase || 0
    );

    if (subtotal < minimumPurchase) {
      return 0;
    }

    const discountValue = Number(
      promo.discount_value || 0
    );

    if (promo.discount_type === "percentage") {
      return Math.min(
        subtotal,
        subtotal * (discountValue / 100)
      );
    }

    if (promo.discount_type === "fixed") {
      return Math.min(subtotal, discountValue);
    }

    return 0;
  }, [selectedMember, promo, subtotal]);

  const total = Math.max(
    0,
    subtotal - discount
  );

  // =========================================================
  // CHANGE
  // =========================================================

  const change = useMemo(() => {
    if (paymentMethod !== "cash") {
      return 0;
    }

    return Math.max(
      0,
      Number(paymentAmount || 0) - total
    );
  }, [paymentAmount, paymentMethod, total]);

  // =========================================================
  // CHECKOUT
  // =========================================================

  async function handleCheckout() {
    if (cart.length === 0) {
      setMessage("Keranjang masih kosong.");
      return;
    }

    if (
      paymentMethod === "cash" &&
      Number(paymentAmount || 0) < total
    ) {
      setMessage("Nominal pembayaran kurang.");
      return;
    }

    try {
      setCheckoutLoading(true);
      setMessage("");

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          member_id: memberId
            ? Number(memberId)
            : null,

          payment_method: paymentMethod,

          payment_amount:
            paymentMethod === "cash"
              ? Number(paymentAmount || 0)
              : total,

          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(
          json.message || "Checkout gagal."
        );
      }

      const transactionId = json.data?.id;

      setCart([]);
      setPaymentAmount("");
      setMemberId("");

      if (transactionId) {
        window.location.href =
          `/petugas/transaksi/${transactionId}`;
      } else {
        setMessage("Transaksi berhasil.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setMessage(
        error.message || "Checkout gagal."
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  // =========================================================
  // CREATE MEMBER
  // =========================================================

  async function handleCreateMember(event) {
    event.preventDefault();

    if (!memberForm.name.trim()) {
      setMessage("Nama member wajib diisi.");
      return;
    }

    if (!memberForm.phone.trim()) {
      setMessage("Nomor HP member wajib diisi.");
      return;
    }

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: memberForm.name.trim(),
          phone: memberForm.phone.trim(),
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(
          json.message || "Gagal membuat member."
        );
      }

      const newMember = json.data;

      setMembers((current) => [
        newMember,
        ...current,
      ]);

      setMemberId(String(newMember.id));

      setMemberForm({
        name: "",
        phone: "",
      });

      setShowMemberModal(false);

      setMessage(
        "Member berhasil ditambahkan."
      );
    } catch (error) {
      console.error("Create member error:", error);

      setMessage(
        error.message ||
          "Gagal membuat member."
      );
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-w-0">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="mb-6">
        <p className="text-sm font-medium text-primary">
          Penjualan
        </p>

        <div className="mt-1 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Kasir
          </h1>

          <button
            type="button"
            onClick={loadData}
            className="shrink-0 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* MESSAGE */}

      {message && (
        <div className="mb-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-sm">
          {message}
        </div>
      )}

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        {/* ===================================================
            PRODUCT SECTION
        ==================================================== */}

        <section className="min-w-0">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            {/* SEARCH */}

            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Cari nama produk atau SKU..."
                className="h-11 min-w-0 rounded-lg border border-line bg-surface px-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
              />

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="h-11 rounded-lg border border-line bg-surface px-4 text-sm text-ink outline-none focus:border-primary"
              >
                <option value="all">
                  Semua kategori
                </option>

                {categories.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* PRODUCT LIST */}

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-72 animate-pulse rounded-xl border border-line bg-canvas"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line px-6 py-14 text-center">
                <p className="font-medium text-ink">
                  Produk tidak ditemukan
                </p>

                <p className="mt-1 text-sm text-muted">
                  Coba ubah pencarian atau kategori.
                </p>
              </div>
            ) : (
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map(
                  (product) => {
                    const cartItem =
                      cart.find(
                        (item) =>
                          item.id === product.id
                      );

                    const stock = Number(
                      product.stock || 0
                    );

                    return (
                      <div
                        key={product.id}
                        className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:border-primary/40 hover:shadow-sm"
                      >
                        {/* IMAGE */}

                        <div className="flex h-40 w-full items-center justify-center overflow-hidden bg-canvas">
                          {product.photo ? (
                            <img
                              src={product.photo}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm text-muted">
                              No Image
                            </span>
                          )}
                        </div>

                        {/* CONTENT */}

                        <div className="flex flex-1 flex-col p-4">
                          <div className="min-w-0">
                            <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-ink">
                              {product.name}
                            </h3>

                            <p className="mt-1 truncate text-xs text-muted">
                              {product.sku || "-"}
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              Stok {stock}
                            </p>
                          </div>

                          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                            <p className="min-w-0 truncate text-sm font-semibold text-ink">
                              {formatRupiah(
                                product.price
                              )}
                            </p>

                            <button
                              type="button"
                              disabled={stock <= 0}
                              onClick={() =>
                                addToCart(product)
                              }
                              className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {cartItem
                                ? `+${cartItem.quantity}`
                                : "+ Tambah"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </section>

        {/* ===================================================
            CART
        ==================================================== */}

        <aside className="min-w-0">
          <div className="sticky top-5 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            {/* CART HEADER */}

            <div className="border-b border-line px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-ink">
                    Keranjang
                  </h2>

                  <p className="mt-0.5 text-xs text-muted">
                    {cart.reduce(
                      (sum, item) =>
                        sum + item.quantity,
                      0
                    )}{" "}
                    item
                  </p>
                </div>

                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs font-medium text-danger hover:underline"
                  >
                    Kosongkan
                  </button>
                )}
              </div>
            </div>

            {/* CART ITEMS */}

            <div className="max-h-[330px] overflow-y-auto px-5">
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-ink">
                    Keranjang masih kosong
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Tambahkan produk dari etalase.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {formatRupiah(
                              item.price
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                          className="shrink-0 text-xs text-danger hover:underline"
                        >
                          Hapus
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center overflow-hidden rounded-lg border border-line">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseQuantity(
                                item.id
                              )
                            }
                            className="h-8 w-8 text-ink hover:bg-canvas"
                          >
                            −
                          </button>

                          <span className="flex h-8 min-w-8 items-center justify-center border-x border-line px-2 text-xs font-semibold text-ink">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseQuantity(
                                item.id
                              )
                            }
                            className="h-8 w-8 text-ink hover:bg-canvas"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm font-semibold text-ink">
                          {formatRupiah(
                            item.price *
                              item.quantity
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* =================================================
                CHECKOUT
            ================================================== */}

            <div className="border-t border-line px-5 py-5">
              {/* MEMBER */}

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-ink">
                    Member
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setShowMemberModal(true)
                    }
                    className="shrink-0 text-xs font-semibold text-primary hover:underline"
                  >
                    + Member baru
                  </button>
                </div>

                <select
                  value={memberId}
                  onChange={(event) =>
                    setMemberId(
                      event.target.value
                    )
                  }
                  className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                >
                  <option value="">
                    Bukan member
                  </option>

                  {members.map((member) => (
                    <option
                      key={member.id}
                      value={member.id}
                    >
                      {member.name} —{" "}
                      {member.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* PROMO */}

              {selectedMember && promo && (
                <div className="mt-3 rounded-xl border border-success/30 bg-success/5 p-3">
                  <p className="text-sm font-semibold text-success">
                    🎉 {promo.name}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    {promo.discount_type ===
                    "percentage"
                      ? `Diskon ${Number(
                          promo.discount_value
                        )}%`
                      : `Diskon ${formatRupiah(
                          promo.discount_value
                        )}`}
                  </p>

                  {Number(
                    promo.minimum_purchase || 0
                  ) > 0 && (
                    <p className="mt-1 text-xs text-muted">
                      Minimal belanja{" "}
                      {formatRupiah(
                        promo.minimum_purchase
                      )}
                    </p>
                  )}

                  {discount > 0 ? (
                    <p className="mt-2 text-sm font-semibold text-success">
                      Promo diterapkan: -
                      {formatRupiah(discount)}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs font-medium text-warning">
                      Belum mencapai minimum
                      pembelian.
                    </p>
                  )}
                </div>
              )}

              {/* SUMMARY */}

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    Subtotal
                  </span>

                  <span className="font-medium text-ink">
                    {formatRupiah(subtotal)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-success">
                      Diskon
                    </span>

                    <span className="font-medium text-success">
                      -{formatRupiah(discount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-line pt-3">
                  <span className="font-semibold text-ink">
                    Total
                  </span>

                  <span className="text-xl font-bold text-ink">
                    {formatRupiah(total)}
                  </span>
                </div>
              </div>

              {/* PAYMENT */}

              <div className="mt-5">
                <label className="mb-2 block text-xs font-semibold text-ink">
                  Pembayaran
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentMethod("cash")
                    }
                    className={`h-10 rounded-lg border text-sm font-medium transition ${
                      paymentMethod === "cash"
                        ? "border-primary bg-primary text-white"
                        : "border-line bg-surface text-ink hover:bg-canvas"
                    }`}
                  >
                    Cash
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentMethod("qris")
                    }
                    className={`h-10 rounded-lg border text-sm font-medium transition ${
                      paymentMethod === "qris"
                        ? "border-primary bg-primary text-white"
                        : "border-line bg-surface text-ink hover:bg-canvas"
                    }`}
                  >
                    QRIS
                  </button>
                </div>
              </div>

              {/* CASH */}

              {paymentMethod === "cash" && (
                <div className="mt-3">
                  <input
                    type="number"
                    min="0"
                    value={paymentAmount}
                    onChange={(event) =>
                      setPaymentAmount(
                        event.target.value
                      )
                    }
                    placeholder="Nominal pembayaran"
                    className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                  />

                  {Number(
                    paymentAmount || 0
                  ) > 0 && (
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted">
                        Kembalian
                      </span>

                      <span
                        className={`font-semibold ${
                          Number(
                            paymentAmount
                          ) >= total
                            ? "text-success"
                            : "text-danger"
                        }`}
                      >
                        {formatRupiah(change)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* QRIS */}

              {paymentMethod === "qris" && (
                <div className="mt-4 rounded-xl border border-line bg-canvas p-4">
                    <img
                      src="/qris/qris-demo.png"
                      alt="QRIS Demo"
                      className="mx-auto w-full max-w-[280px] rounded-xl"
                    />

                    <p className="mt-3 text-center text-xs text-muted">
                      QRIS Demo — hanya untuk simulasi pembayaran.
                    </p>
                  </div>
                )}

              {/* CHECKOUT */}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={
                  checkoutLoading ||
                  cart.length === 0 ||
                  (paymentMethod === "cash" &&
                    Number(
                      paymentAmount || 0
                    ) < total)
                }
                className="mt-5 h-12 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {checkoutLoading
                  ? "Memproses..."
                  : "Bayar Sekarang"}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* =====================================================
          MEMBER MODAL
      ====================================================== */}

      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  Tambah Member
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Member baru langsung bisa
                  digunakan untuk transaksi.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowMemberModal(false)
                }
                className="text-xl text-muted hover:text-ink"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateMember}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-ink">
                  Nama
                </label>

                <input
                  type="text"
                  value={memberForm.name}
                  onChange={(event) =>
                    setMemberForm({
                      ...memberForm,
                      name: event.target.value,
                    })
                  }
                  placeholder="Nama member"
                  className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink">
                  Nomor HP
                </label>

                <input
                  type="text"
                  value={memberForm.phone}
                  onChange={(event) =>
                    setMemberForm({
                      ...memberForm,
                      phone: event.target.value,
                    })
                  }
                  placeholder="08xxxxxxxxxx"
                  className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowMemberModal(false)
                  }
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Simpan Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}