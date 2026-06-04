# TODO - Persistensi input user (tanpa database)

- [ ] Analisis kode: tentukan state yang harus disimpan (inputs & rateMode/rates yang relevan)
- [ ] Tentukan skema key localStorage dan format data
- [ ] Implementasi hook load dari localStorage saat aplikasi pertama kali mount
- [x] Implementasi hook save ke localStorage saat state berubah (debounce untuk performa)
- [x] Tambahkan tombol/reset untuk menghapus data terakhir
- [x] Jalankan build/lint sederhana untuk memastikan tidak ada error
- [ ] Verifikasi bahwa refresh browser mempertahankan input terakhir user
