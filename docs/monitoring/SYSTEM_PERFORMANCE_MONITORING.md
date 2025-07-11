# Booksphere System Performance Monitoring Guide

**Last Updated:** January 15, 2025  
**Status:** Production-ready monitoring system deployed

## Overview

This guide provides step-by-step instructions for monitoring the Booksphere system performance. The monitoring system tracks cataloging jobs, inventory search performance, and overall system health to ensure optimal performance and early problem detection.

## 🎯 **What We Monitor**

### **Core Components**
- **Cataloging System**: Job processing performance and queue health
- **Inventory Search**: Query performance across 40K+ records
- **Database Indexes**: Usage patterns and efficiency metrics
- **System Health**: Overall component status and recommendations

### **Key Benefits**
- **Early Problem Detection**: Spot issues before they impact users
- **Performance Optimization**: Identify slow queries and unused indexes
- **Capacity Planning**: Track growth and resource usage
- **System Reliability**: Ensure all components are healthy

---

## 📊 **Daily Monitoring Tasks**

### **1. Quick System Health Check**
**Frequency**: Daily (2 minutes)  
**Purpose**: Verify all system components are healthy

```sql
-- Run this first every day
SELECT * FROM run_system_health_check();
```

**Expected Results:**
- All components should show `HEALTHY` status
- Cataloging indexes: 7 configured
- Inventory indexes: 17+ configured
- Data volume should show growing numbers

**🚨 Red Flags:**
- Any component showing `NEEDS_ATTENTION`
- Dramatic drops in data volume
- Missing indexes (less than expected counts)

### **2. Cataloging Performance Check**
**Frequency**: Daily (1 minute)  
**Purpose**: Monitor cataloging job processing

```sql
-- Check cataloging system performance
SELECT * FROM get_cataloging_performance_metrics();
```

**What to Look For:**
- **active_jobs**: Should be reasonable (not stuck high)
- **failed_jobs**: Should be low percentage of total
- **index_scans**: Should be growing (indicates usage)

**🚨 Red Flags:**
- High number of failed jobs (>10% of total)
- Active jobs stuck at same number for days
- Zero index scans (indicates system not being used)

### **3. Inventory Search Performance**
**Frequency**: 2-3 times per week (3 minutes)  
**Purpose**: Ensure search queries are efficient

```sql
-- Check inventory search performance
SELECT * FROM inventory_search_performance 
WHERE usage_level != 'UNUSED'
ORDER BY scans DESC
LIMIT 15;
```

**Performance Indicators:**
- **HIGH usage**: Critical indexes getting heavy use ✅
- **MODERATE usage**: Normal operational indexes ✅
- **LOW usage**: Occasional-use indexes ⚠️
- **UNUSED**: May need removal or optimization ❌

---

## 🔍 **Performance Interpretation Guide**

### **Understanding Metrics**

#### **Cataloging Metrics**
| Metric | Good | Concerning | Critical |
|--------|------|------------|----------|
| **Total Jobs** | Growing steadily | Flat for weeks | Decreasing |
| **Active Jobs** | 0-10 | 11-50 | 50+ |
| **Failed Jobs** | <5% of total | 5-15% | >15% |
| **Index Scans** | Growing | Stable | Decreasing |

#### **Inventory Performance**
| Usage Level | Interpretation | Action Needed |
|-------------|----------------|---------------|
| **HIGH** | Critical path working well | Monitor regularly |
| **MODERATE** | Normal operations | Check monthly |
| **LOW** | Light usage | Review quarterly |
| **UNUSED** | Potential waste | Consider removal |

#### **Index Efficiency**
```sql
-- Deep dive into index efficiency
SELECT 
    table_name,
    index_name,
    scans,
    tuples_read,
    CASE 
        WHEN scans = 0 THEN 'UNUSED'
        WHEN tuples_read / NULLIF(scans, 0) > 1000 THEN 'INEFFICIENT'
        ELSE 'EFFICIENT'
    END as efficiency,
    usage_level
FROM inventory_search_performance
ORDER BY scans DESC;
```

---

## 🚨 **Troubleshooting Guide**

### **Common Issues & Solutions**

#### **Problem: High Failed Jobs**
**Symptoms**: `failed_jobs` metric is high (>10% of total)

**Investigation Steps:**
```sql
-- Check recent failed jobs
SELECT 
    status,
    source_type,
    created_at,
    updated_at,
    extracted_data
FROM cataloging_jobs 
WHERE status = 'failed'
ORDER BY updated_at DESC
LIMIT 10;
```

**Common Causes:**
- External AI service (Buildship) connectivity issues
- Invalid ISBN data
- Image processing failures
- Database connection timeouts

#### **Problem: Slow Inventory Searches**
**Symptoms**: Users report slow search performance

**Investigation Steps:**
```sql
-- Check for inefficient indexes
SELECT * FROM inventory_search_performance 
WHERE usage_level = 'HIGH' 
AND tuples_read / NULLIF(scans, 0) > 1000;
```

**Solutions:**
- Add missing indexes for common query patterns
- Optimize existing queries
- Consider archiving old data

#### **Problem: Active Jobs Stuck**
**Symptoms**: `active_jobs` count stays high for extended periods

**Investigation Steps:**
```sql
-- Check stuck jobs
SELECT 
    id,
    status,
    source_type,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/3600 as hours_since_update
FROM cataloging_jobs 
WHERE status IN ('pending', 'processing')
ORDER BY updated_at ASC;
```

**Solutions:**
- Restart Edge Functions
- Check Buildship service status
- Manual job retry/cancellation

---

## 📈 **Advanced Performance Analysis**

### **Weekly Deep Dive** (10 minutes)
**Purpose**: Identify trends and optimization opportunities

```sql
-- 1. Performance trends over time
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60) as avg_processing_minutes
FROM cataloging_jobs 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- 2. Index usage patterns
SELECT 
    table_name,
    COUNT(*) as total_indexes,
    COUNT(CASE WHEN usage_level = 'HIGH' THEN 1 END) as high_usage,
    COUNT(CASE WHEN usage_level = 'UNUSED' THEN 1 END) as unused
FROM inventory_search_performance
GROUP BY table_name;

-- 3. System growth metrics
SELECT 
    'Stock Items' as table_name,
    COUNT(*) as current_count,
    MAX(created_at) as latest_addition
FROM stock_items
UNION ALL
SELECT 
    'Editions' as table_name,
    COUNT(*) as current_count,
    MAX(created_at) as latest_addition
FROM editions
UNION ALL
SELECT 
    'Books' as table_name,
    COUNT(*) as current_count,
    MAX(created_at) as latest_addition
FROM books;
```

### **Monthly Index Optimization** (15 minutes)
**Purpose**: Clean up unused indexes and add new ones

```sql
-- 1. Find completely unused indexes
SELECT 
    table_name,
    index_name,
    scans,
    'Consider removal' as recommendation
FROM inventory_search_performance 
WHERE scans = 0 
AND index_name NOT LIKE '%_pkey'  -- Keep primary keys
ORDER BY table_name, index_name;

-- 2. Find potentially over-indexed tables
SELECT 
    table_name,
    COUNT(*) as index_count,
    SUM(scans) as total_scans,
    CASE 
        WHEN COUNT(*) > 8 THEN 'May be over-indexed'
        ELSE 'Normal'
    END as assessment
FROM inventory_search_performance
GROUP BY table_name
ORDER BY index_count DESC;
```

---

## 🔔 **Setting Up Alerts**

### **Manual Monitoring Schedule**
Since you're new to monitoring, start with this schedule:

**Daily (5 minutes)**:
- Run system health check
- Check cataloging metrics
- Review any alerts from previous day

**Weekly (15 minutes)**:
- Review inventory performance
- Check for inefficient indexes
- Analyze performance trends

**Monthly (30 minutes)**:
- Deep performance analysis
- Index optimization review
- Capacity planning assessment

### **Future: Automated Monitoring**
Consider setting up automated alerts for:
- Failed job percentage > 10%
- Active jobs stuck > 24 hours
- Index scans dropping significantly
- System health check failures

---

## 📚 **Quick Reference**

### **Essential Monitoring Commands**
```sql
-- Daily essentials
SELECT * FROM run_system_health_check();
SELECT * FROM get_cataloging_performance_metrics();

-- Weekly review
SELECT * FROM inventory_search_performance 
WHERE usage_level != 'UNUSED' 
ORDER BY scans DESC LIMIT 10;

-- Monthly cleanup
SELECT * FROM inventory_search_performance 
WHERE scans = 0 AND index_name NOT LIKE '%_pkey';
```

### **Performance Baselines**
**Current System (as of Jan 15, 2025):**
- Stock Items: 41,176
- Editions: 39,443  
- Books: 38,709
- Cataloging Indexes: 7
- Inventory Indexes: 17

**Expected Growth:**
- Monitor for 10-20% monthly growth in inventory
- Cataloging jobs should increase with mobile app usage
- Index scans should grow proportionally

---

## 🆘 **When to Get Help**

Contact technical support if:
- System health check shows `NEEDS_ATTENTION` for multiple components
- Failed job rate exceeds 20%
- Performance degradation > 50% from baseline
- Any component shows `CRITICAL` status

**Include in support request:**
- Results from all monitoring queries
- Timeframe when issues started
- Any recent changes or deployments
- Error messages or unusual behavior observed

---

*This monitoring system provides comprehensive visibility into your Booksphere performance. Start with the daily tasks and gradually expand to weekly and monthly analysis as you become more comfortable with the metrics.* 