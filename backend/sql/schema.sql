-- Create database if not exists
CREATE DATABASE IF NOT EXISTS forex_trading_journal
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE forex_trading_journal;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    starting_balance DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Strategies table
CREATE TABLE IF NOT EXISTS strategies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entry_rules TEXT,
    exit_rules TEXT,
    risk_rules TEXT,
    timeframes VARCHAR(255),
    sessions VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    trade_date DATE NOT NULL,
    pair VARCHAR(50) NOT NULL,
    direction ENUM('BUY', 'SELL') NOT NULL,
    timeframe VARCHAR(20) NOT NULL,
    session VARCHAR(50) NOT NULL,
    strategy_id INT NULL,
    entry_price DECIMAL(15,5) NOT NULL,
    stop_loss DECIMAL(15,5) NOT NULL,
    take_profit DECIMAL(15,5) NOT NULL,
    exit_price DECIMAL(15,5) NULL,
    lot_size DECIMAL(10,2) NULL,
    risk_percentage DECIMAL(5,2) NULL,
    risk_reward VARCHAR(20) NULL,
    result ENUM('WIN', 'LOSS', 'BREAK EVEN') NOT NULL,
    profit_loss DECIMAL(15,2) NOT NULL,
    setup_description TEXT,
    entry_reason TEXT,
    exit_reason TEXT,
    mistake TEXT,
    lesson_learned TEXT,
    notes TEXT,
    image_data MEDIUMTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE SET NULL,
    INDEX idx_user_date (user_id, trade_date),
    INDEX idx_user_pair (user_id, pair),
    INDEX idx_user_strategy (user_id, strategy_id),
    INDEX idx_user_result (user_id, result)
) ENGINE=InnoDB;

-- Backtesting Sessions table
CREATE TABLE IF NOT EXISTS backtesting_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    strategy_id INT NULL,
    pair VARCHAR(50) NOT NULL,
    timeframe VARCHAR(20) NOT NULL,
    session VARCHAR(50) NULL,
    testing_start_date DATE NULL,
    testing_end_date DATE NULL,
    total_trades INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    break_even INT DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    total_r DECIMAL(10,2) DEFAULT 0.00,
    average_r DECIMAL(10,2) DEFAULT 0.00,
    starting_balance DECIMAL(15,2) DEFAULT 10000.00,
    ending_balance DECIMAL(15,2) DEFAULT 10000.00,
    max_drawdown DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE SET NULL,
    INDEX idx_user_backtesting (user_id)
) ENGINE=InnoDB;

-- Backtesting Reviews table
CREATE TABLE IF NOT EXISTS backtesting_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    backtesting_session_id INT NOT NULL UNIQUE,
    what_worked TEXT,
    what_failed TEXT,
    common_mistakes TEXT,
    observations TEXT,
    improvements TEXT,
    conclusion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (backtesting_session_id) REFERENCES backtesting_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Per-user, manually observed TET context and checklist configuration
CREATE TABLE IF NOT EXISTS tet_user_configs (
    user_id INT PRIMARY KEY,
    config_json LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
