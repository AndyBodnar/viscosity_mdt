-- ============================================================================
--  viscosity_mdt  ·  (c) 2026 AndyBodnar (Viscosity)
--  https://github.com/AndyBodnar/viscosity_mdt
--  Server use only. No resale, repackaging, or credit removal. See LICENSE.
-- ============================================================================
-- ============================================================
--  Viscosity MDT — client
--  Two modes:
--   • 'select' — character creation/selection (opened at spawn by the core)
--   • 'os'     — the tablet OS, opened in-game with /mdt
-- ============================================================

local isOpen = false
local mode = nil

-- Character selection now lives in viscosity_multichar (cinematic select +
-- spawn picker). The MDT only opens in-game via /mdt and never auto-opens.

-- ---------- open: tablet OS (/mdt) ----------
local function openOS()
    if isOpen then return end
    if not exports['viscosity_core']:IsLoaded() then
        TriggerEvent('chat:addMessage', { args = { 'MDT', 'Your character is still loading…' } })
        return
    end
    isOpen = true
    mode = 'os'
    SetNuiFocus(true, true)
    SendNUIMessage({ type = 'open', data = exports['viscosity_core']:GetPlayerData() })
end

local function closeOS()
    if not isOpen or mode ~= 'os' then return end
    isOpen = false
    mode = nil
    SetNuiFocus(false, false)
    SendNUIMessage({ type = 'close' })
end

RegisterCommand('mdt', openOS, false)
RegisterCommand('tablet', openOS, false)

-- ============================================================
--  NUI callbacks
-- ============================================================
RegisterNUICallback('close', function(_, cb)
    closeOS()          -- only the OS can be closed; select must pick a character
    cb('ok')
end)

-- Character select actions
RegisterNUICallback('char:create', function(data, cb)
    if data then TriggerServerEvent('viscosity_core:server:createCharacter', data) end
    cb('ok')
end)
RegisterNUICallback('char:select', function(data, cb)
    if data and data.citizenid then TriggerServerEvent('viscosity_core:server:selectCharacter', data.citizenid) end
    cb('ok')
end)
RegisterNUICallback('char:delete', function(data, cb)
    if data and data.citizenid then TriggerServerEvent('viscosity_core:server:deleteCharacter', data.citizenid) end
    cb('ok')
end)

-- DMV actions
RegisterNUICallback('dmv:vehicles', function(_, cb)
    TriggerServerEvent('viscosity_core:server:requestVehicles')
    cb('ok')
end)
RegisterNUICallback('dmv:register', function(data, cb)
    if data then TriggerServerEvent('viscosity_core:server:registerVehicle', data) end
    cb('ok')
end)
RegisterNUICallback('dmv:license', function(data, cb)
    if data and data.id then TriggerServerEvent('viscosity_core:server:applyLicense', data.id) end
    cb('ok')
end)

-- ============================================================
--  Server -> NUI
-- ============================================================
RegisterNetEvent('viscosity_core:client:setVehicles', function(rows)
    if isOpen then SendNUIMessage({ type = 'vehicles', vehicles = rows or {} }) end
end)

RegisterNetEvent('viscosity_core:client:dmvResult', function(ok, msg)
    if isOpen then SendNUIMessage({ type = 'dmvResult', ok = ok, msg = msg }) end
end)

RegisterNetEvent('viscosity_core:client:setPlayerData', function(data)
    if isOpen then SendNUIMessage({ type = 'setData', data = data }) end
end)

-- Safety
AddEventHandler('onResourceStop', function(res)
    if res == GetCurrentResourceName() and isOpen then
        SetNuiFocus(false, false)
        setSelectFreeze(false)
    end
end)
