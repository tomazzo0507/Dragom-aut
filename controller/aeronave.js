document.addEventListener('DOMContentLoaded', () => {
  // ===== Rol mock (usa 'editor' o 'revisor') =====
  const role = localStorage.getItem('dfr_role') || 'revisor'
  document.body.dataset.role = role
  if (role !== 'editor') {
    document.querySelectorAll('.only-editor').forEach(el => el.remove())
  }

  // ===== Datos mock (simula backend) =====
  let DATA = [
    {
      id: crypto.randomUUID(),
      ac: { sn: 'DGM-2024-000001', mision: 20, total: 180, max_h: 100 },
      bat: [
        { sn: 'BAT-001', mision: 10, total: 90, ciclos: 12 },
        { sn: 'BAT-002', mision: 10, total: 80, ciclos: 10 },
      ],
      mot: [{sn:'MOT-001'},{sn:'MOT-002'},{sn:'MOT-003'},{sn:'MOT-004'}],
      updatedAt: new Date()
    },
    {
      id: crypto.randomUUID(),
      ac: { sn: 'DGM-2024-000002', mision: 35, total: 240, max_h: 120 },
      bat: [
        { sn: 'BAT-010', mision: 18, total: 110, ciclos: 22 },
        { sn: 'BAT-011', mision: 17, total: 105, ciclos: 18 },
      ],
      mot: [{sn:'MOT-101'},{sn:'MOT-102'},{sn:'MOT-103'},{sn:'MOT-104'}],
      updatedAt: new Date()
    }
  ]

  // ===== DOM =====
  const listEl = document.getElementById('aircraft-list')
  const searchForm = document.getElementById('search-form')
  const searchInput = document.getElementById('search-sn')
  const btnAdd = document.getElementById('btn-add')

  // Modal
  const modal = document.getElementById('aircraft-modal')
  const modalTitle = document.getElementById('modal-title')
  const modalClose = document.getElementById('modal-close')
  const modalCancel = document.getElementById('modal-cancel')
  const form = document.getElementById('aircraft-form')

  // Form fields
  const $ = (id) => document.getElementById(id)
  const F = {
    ac_sn: $('ac_sn'),
    ac_mision: $('ac_mision'),
    ac_total: $('ac_total'),
    ac_max_h: $('ac_max_h'),
    bat1_sn: $('bat1_sn'),
    bat1_mision: $('bat1_mision'),
    bat1_total: $('bat1_total'),
    bat1_ciclos: $('bat1_ciclos'),
    bat2_sn: $('bat2_sn'),
    bat2_mision: $('bat2_mision'),
    bat2_total: $('bat2_total'),
    bat2_ciclos: $('bat2_ciclos'),
    mot1_sn: $('mot1_sn'),
    mot2_sn: $('mot2_sn'),
    mot3_sn: $('mot3_sn'),
    mot4_sn: $('mot4_sn'),
  }

  let editingId = null

  // ===== Render =====
  function render(list = DATA) {
    if (!listEl) return
    if (!list.length) {
      listEl.innerHTML = `
        <div class="card" style="grid-column: 1/-1 align-items:center text-align:center">
          <div class="meta">No hay aeronaves para mostrar.</div>
        </div>`
      return
    }

    listEl.innerHTML = list.map(item => {
      const ac = item.ac
      const b1 = item.bat?.[0] || {}
      const b2 = item.bat?.[1] || {}
      const m = item.mot || []
      const updated = new Date(item.updatedAt).toLocaleString()

      return `
      <article class="card" data-id="${item.id}">
        <div class="card__head">
          <div>
            <div class="sn">${ac.sn}</div>
            <div class="meta">Actualizado: ${updated}</div>
          </div>
          <span class="badge"><i class="ph ph-airplane-tilt"></i> DRAGOM</span>
        </div>

        <div class="card__body">
          <div class="block">
            <h4>Aircraft</h4>
            <div class="kv">Misión: ${ac.mision ?? 0} min</div>
            <div class="kv">Total: ${ac.total ?? 0} min</div>
            <div class="kv">Máx: ${ac.max_h ?? 0} h</div>
          </div>

          <div class="block">
            <h4>Batería 1</h4>
            <div class="kv">S/N: ${b1.sn ?? '-'}</div>
            <div class="kv">Misión: ${b1.mision ?? 0} min</div>
            <div class="kv">Total: ${b1.total ?? 0} min</div>
            <div class="kv">Ciclos: ${b1.ciclos ?? 0}</div>
          </div>

          <div class="block">
            <h4>Batería 2</h4>
            <div class="kv">S/N: ${b2.sn ?? '-'}</div>
            <div class="kv">Misión: ${b2.mision ?? 0} min</div>
            <div class="kv">Total: ${b2.total ?? 0} min</div>
            <div class="kv">Ciclos: ${b2.ciclos ?? 0}</div>
          </div>

          <div class="block">
            <h4>Motores</h4>
            <div class="kv">1: ${m[0]?.sn ?? '-'}</div>
            <div class="kv">2: ${m[1]?.sn ?? '-'}</div>
            <div class="kv">3: ${m[2]?.sn ?? '-'}</div>
            <div class="kv">4: ${m[3]?.sn ?? '-'}</div>
          </div>
        </div>

        <div class="card__foot">
          <button class="btn only-editor" data-action="edit"><i class="ph ph-pencil-simple-line"></i> Editar</button>
          <button class="btn btn-danger only-editor" data-action="delete"><i class="ph ph-trash"></i> Eliminar</button>
        </div>
      </article>`
    }).join('')
  }

  // ===== Modal helpers =====
  function openModal(mode = 'add', data = null) {
    modal.classList.add('show')
    modal.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'

    modalTitle.textContent = mode === 'add' ? 'Nueva aeronave' : 'Editar aeronave'
    if (mode === 'add') {
      editingId = null
      form.reset()
    } else if (data) {
      editingId = data.id
      F.ac_sn.value = data.ac?.sn ?? ''
      F.ac_mision.value = data.ac?.mision ?? ''
      F.ac_total.value = data.ac?.total ?? ''
      F.ac_max_h.value = data.ac?.max_h ?? ''
      F.bat1_sn.value = data.bat?.[0]?.sn ?? ''
      F.bat1_mision.value = data.bat?.[0]?.mision ?? ''
      F.bat1_total.value = data.bat?.[0]?.total ?? ''
      F.bat1_ciclos.value = data.bat?.[0]?.ciclos ?? ''
      F.bat2_sn.value = data.bat?.[1]?.sn ?? ''
      F.bat2_mision.value = data.bat?.[1]?.mision ?? ''
      F.bat2_total.value = data.bat?.[1]?.total ?? ''
      F.bat2_ciclos.value = data.bat?.[1]?.ciclos ?? ''
      F.mot1_sn.value = data.mot?.[0]?.sn ?? ''
      F.mot2_sn.value = data.mot?.[1]?.sn ?? ''
      F.mot3_sn.value = data.mot?.[2]?.sn ?? ''
      F.mot4_sn.value = data.mot?.[3]?.sn ?? ''
    }
  }
  function closeModal() {
    modal.classList.remove('show')
    modal.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = ''
    form.reset()
    editingId = null
  }

  // ===== Eventos =====
  btnAdd?.addEventListener('click', () => {
    if (role !== 'editor') return alert('Esta acción requiere rol Editor.')
    openModal('add')
  })
  modalClose?.addEventListener('click', closeModal)
  modalCancel?.addEventListener('click', closeModal)
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal() })
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && modal.classList.contains('show')) closeModal() })

  // Submit crear/editar
  form?.addEventListener('submit', (e) => {
    e.preventDefault()
    if (role !== 'editor') return alert('Esta acción requiere rol Editor.')

    const payload = {
      ac: {
        sn: F.ac_sn.value.trim(),
        mision: Number(F.ac_mision.value || 0),
        total: Number(F.ac_total.value || 0),
        max_h: Number(F.ac_max_h.value || 0),
      },
      bat: [
        { sn: F.bat1_sn.value.trim(), mision: Number(F.bat1_mision.value || 0), total: Number(F.bat1_total.value || 0), ciclos: Number(F.bat1_ciclos.value || 0) },
        { sn: F.bat2_sn.value.trim(), mision: Number(F.bat2_mision.value || 0), total: Number(F.bat2_total.value || 0), ciclos: Number(F.bat2_ciclos.value || 0) },
      ],
      mot: [
        { sn: F.mot1_sn.value.trim() },
        { sn: F.mot2_sn.value.trim() },
        { sn: F.mot3_sn.value.trim() },
        { sn: F.mot4_sn.value.trim() },
      ],
      updatedAt: new Date()
    }

    if (!payload.ac.sn) {
      alert('El S/N del Aircraft es obligatorio.')
      return
    }

    if (editingId) {
      DATA = DATA.map(it => it.id === editingId ? { ...it, ...payload } : it)
    } else {
      DATA.unshift({ id: crypto.randomUUID(), ...payload })
    }

    render(filterBySN(searchInput.value))
    closeModal()
  })

  // Delegación: Editar / Eliminar
  listEl?.addEventListener('click', (e) => {
    const card = e.target.closest('.card')
    if (!card) return

    const id = card.getAttribute('data-id')
    const actionBtn = e.target.closest('button[data-action]')
    if (!actionBtn) return

    if (role !== 'editor') return alert('Esta acción requiere rol Editor.')

    const action = actionBtn.getAttribute('data-action')
    const item = DATA.find(x => x.id === id)
    if (!item) return

    if (action === 'edit') {
      openModal('edit', item)
    } else if (action === 'delete') {
      if (confirm(`¿Eliminar aeronave ${item.ac?.sn}?`)) {
        DATA = DATA.filter(x => x.id !== id)
        render(filterBySN(searchInput.value))
      }
    }
  })

  // Búsqueda por S/N
  function filterBySN(q) {
    const term = (q || '').trim().toLowerCase()
    if (!term) return DATA
    return DATA.filter(it => it.ac?.sn?.toLowerCase().includes(term))
  }
  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault()
    render(filterBySN(searchInput.value))
  })

  // Render inicial
  render()
})
